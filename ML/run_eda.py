"""Generate ATM EDA artifacts, report, and a chronological ML split."""

from pathlib import Path
from textwrap import dedent
from typing import List, Tuple

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.ticker import MaxNLocator
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "ml_dataset_final.csv"
ATM_MASTER_FILE = BASE_DIR / "atm_master.csv"
CALENDAR_FILE = BASE_DIR / "calendar.csv"
PLOTS_DIR = BASE_DIR / "plots"
REPORT_FILE = BASE_DIR / "EDA_Report.pdf"
TRAIN_FILE = BASE_DIR / "ml_train.csv"
TEST_FILE = BASE_DIR / "ml_test.csv"
RANDOM_SEED = 20260729
TARGET = "tomorrow_withdrawal"

NUMERIC_FEATURES = [
    "previous_day_withdrawal", "rolling_average_3", "rolling_average_7",
    "rolling_average_14", "rolling_average_30", "monthly_average",
    "quarterly_average", "withdrawal_growth_rate", "cash_remaining_percentage",
    "festival_weight", "holiday_weight", "salary_day_weight", "weather_weight",
    "event_weight", "atm_type_encoded", "city_encoded", "days_since_last_refill",
    "cash_utilisation",
]

PLOT_NAMES = {
    "correlation": "correlation_matrix.png",
    "monthly": "monthly_trend.png",
    "atm_heatmap": "atm_heatmap.png",
    "feature_importance": "feature_importance.png",
}


def load_data() -> pd.DataFrame:
    """Load the final ML data and restore readable ATM/calendar dimensions."""
    data = pd.read_csv(INPUT_FILE, parse_dates=["date"])
    atm_master = pd.read_csv(ATM_MASTER_FILE, usecols=["atm_id", "atm_type", "city"])
    calendar = pd.read_csv(
        CALENDAR_FILE,
        parse_dates=["date"],
        usecols=[
            "date", "day_of_week", "month", "quarter", "year", "is_weekend",
            "is_salary_day", "holiday_name", "festival_name", "weather", "local_event",
        ],
    )
    data = data.merge(atm_master, on="atm_id", how="left", validate="many_to_one")
    data = data.merge(calendar, on="date", how="left", validate="many_to_one")
    if data[["atm_type", "city", "weather"]].isna().any().any():
        raise ValueError("EDA enrichment left missing ATM or calendar dimensions")
    return data.sort_values(["date", "atm_id"]).reset_index(drop=True)


def save_summary_tables(data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Export descriptive statistics, missing-value report, and correlations."""
    numeric = data.select_dtypes(include=[np.number])
    summary = numeric.describe().T.round(3)
    summary["missing_count"] = numeric.isna().sum()
    summary["missing_percentage"] = (numeric.isna().mean() * 100).round(3)
    summary.to_csv(BASE_DIR / "summary_statistics.csv")

    missing = pd.DataFrame({
        "column": data.columns,
        "missing_count": data.isna().sum().values,
        "missing_percentage": (data.isna().mean() * 100).round(3).values,
    }).sort_values(["missing_count", "column"], ascending=[False, True])
    missing.to_csv(BASE_DIR / "missing_value_report.csv", index=False)

    correlation = numeric.corr().round(4)
    correlation.to_csv(BASE_DIR / "correlation_matrix.csv")
    return summary, missing, correlation


def save_train_test_split(data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Create a chronological split using only non-leaky numeric features."""
    model_features = [column for column in NUMERIC_FEATURES if column in data.columns]
    split_date = data["date"].quantile(0.80)
    train = data[data["date"] <= split_date].copy()
    test = data[data["date"] > split_date].copy()
    export_columns = ["date", "atm_id"] + model_features + [TARGET]
    train[export_columns].to_csv(TRAIN_FILE, index=False)
    test[export_columns].to_csv(TEST_FILE, index=False)

    model = RandomForestRegressor(
        n_estimators=120,
        max_depth=16,
        min_samples_leaf=3,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(train[model_features], train[TARGET])
    predictions = model.predict(test[model_features])
    metrics = {
        "mae": mean_absolute_error(test[TARGET], predictions),
        "rmse": mean_squared_error(test[TARGET], predictions) ** 0.5,
        "train_rows": len(train),
        "test_rows": len(test),
        "split_date": str(split_date.date()),
    }
    pd.DataFrame([metrics]).to_csv(BASE_DIR / "model_baseline_metrics.csv", index=False)
    importance = pd.Series(model.feature_importances_, index=model_features).sort_values(ascending=False)
    return train, test, importance.tolist(), importance


def save_plot(fig: plt.Figure, filename: str) -> None:
    """Save a figure to the plots directory and close it."""
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / filename, dpi=160, bbox_inches="tight")
    plt.close(fig)


def build_plots(data: pd.DataFrame, correlation: pd.DataFrame,
                importance: pd.Series) -> List[plt.Figure]:
    """Create requested PNG plots and return report figures."""
    sns.set(style="whitegrid", context="notebook")
    report_figures: List[plt.Figure] = []

    fig, ax = plt.subplots(figsize=(13, 10))
    sns.heatmap(correlation, cmap="vlag", center=0, ax=ax)
    ax.set_title("Feature Correlation Matrix")
    save_plot(fig, PLOT_NAMES["correlation"])
    report_figures.append(fig)

    numeric_plot_columns = [
        "previous_day_withdrawal", "rolling_average_7", "cash_remaining_percentage",
        "withdrawal_growth_rate", TARGET,
    ]
    fig, axes = plt.subplots(2, 3, figsize=(15, 9))
    for axis, column in zip(axes.flat, numeric_plot_columns):
        sns.distplot(data[column].dropna(), kde=True, ax=axis, color="#1976a2")
        axis.set_title("Histogram: {}".format(column))
    axes.flat[-1].axis("off")
    save_plot(fig, "histograms.png")
    report_figures.append(fig)

    box_data = data[["previous_day_withdrawal", "rolling_average_7", TARGET]].melt(var_name="feature", value_name="amount")
    fig, ax = plt.subplots(figsize=(12, 7))
    sns.boxplot(data=box_data, x="feature", y="amount", ax=ax, color="#f4a261", showfliers=False)
    ax.set_title("Withdrawal Feature Boxplots")
    ax.tick_params(axis="x", rotation=20)
    save_plot(fig, "boxplots.png")
    report_figures.append(fig)

    atm_means = data.groupby("atm_id")[TARGET].mean().sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(15, 7))
    sns.barplot(x=atm_means.index, y=atm_means.values, ax=ax, color="#2a9d8f")
    ax.set_title("ATM-wise Average Withdrawal")
    ax.set_xlabel("ATM ID")
    ax.set_ylabel("Average withdrawal")
    ax.tick_params(axis="x", rotation=90, labelsize=7)
    save_plot(fig, "atm_withdrawal.png")
    report_figures.append(fig)

    monthly = data.groupby(["date", "year", "month"], as_index=False)[TARGET].mean()
    monthly["period"] = monthly["date"].dt.to_period("M").astype(str)
    monthly_period = monthly.groupby("period", as_index=False)[TARGET].mean()
    fig, ax = plt.subplots(figsize=(15, 6))
    sns.lineplot(data=monthly_period, x="period", y=TARGET, ax=ax, color="#264653")
    ax.set_title("Monthly Average Withdrawal Trend")
    ax.tick_params(axis="x", rotation=75)
    save_plot(fig, PLOT_NAMES["monthly"])
    report_figures.append(fig)

    weekly = data.assign(week=data["date"].dt.to_period("W").astype(str)).groupby("week", as_index=False)[TARGET].mean()
    fig, ax = plt.subplots(figsize=(15, 6))
    sns.lineplot(data=weekly, x="week", y=TARGET, ax=ax, color="#e76f51")
    ax.set_title("Weekly Average Withdrawal Trend")
    ax.xaxis.set_major_locator(MaxNLocator(16))
    ax.tick_params(axis="x", rotation=45)
    save_plot(fig, "weekly_trend.png")
    report_figures.append(fig)

    atm_month = data.assign(period=data["date"].dt.to_period("M").astype(str)).pivot_table(
        index="atm_id", columns="period", values=TARGET, aggfunc="mean"
    )
    fig, ax = plt.subplots(figsize=(16, 18))
    sns.heatmap(atm_month, cmap="YlOrRd", ax=ax, cbar_kws={"label": "Average withdrawal"})
    ax.set_title("ATM-by-Month Demand Heatmap")
    ax.set_xlabel("Month")
    ax.set_ylabel("ATM ID")
    save_plot(fig, PLOT_NAMES["atm_heatmap"])
    report_figures.append(fig)

    for group_column, filename, title in [
        ("city", "city_demand.png", "City-wise Demand"),
        ("atm_type", "atm_type_comparison.png", "ATM-type Demand Comparison"),
    ]:
        grouped = data.groupby(group_column)[TARGET].mean().sort_values(ascending=False)
        fig, ax = plt.subplots(figsize=(12, 7))
        sns.barplot(x=grouped.values, y=grouped.index, ax=ax, color="#457b9d")
        ax.set_title(title)
        ax.set_xlabel("Average withdrawal")
        save_plot(fig, filename)
        report_figures.append(fig)

    impact_specs = [
        ("festival_name", "Festival impact", "festival_impact.png"),
        ("is_weekend", "Weekend impact", "weekend_impact.png"),
        ("is_salary_day", "Salary-day impact", "salary_day_impact.png"),
        ("weather", "Weather impact", "weather_impact.png"),
    ]
    for column, title, filename in impact_specs:
        impact = data.assign(_impact_group=data[column].fillna("None")).groupby("_impact_group")[TARGET].mean().reset_index()
        impact = impact.rename(columns={"_impact_group": column})
        fig, ax = plt.subplots(figsize=(12, 7))
        sns.barplot(data=impact, x=TARGET, y=column, ax=ax, color="#f4a261")
        ax.set_title(title)
        ax.set_xlabel("Average withdrawal")
        save_plot(fig, filename)
        report_figures.append(fig)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    sns.distplot(data["days_since_last_refill"].dropna(), bins=30, ax=axes[0], color="#8ab17d")
    axes[0].set_title("Cash Refill Interval Distribution")
    sns.distplot(data["cash_remaining_percentage"].dropna(), bins=30, ax=axes[1], color="#2a9d8f")
    axes[1].set_title("Cash Remaining Distribution")
    save_plot(fig, "cash_refill_distribution.png")
    report_figures.append(fig)

    anomaly_counts = data["anomaly_type"].value_counts().rename_axis("anomaly_type").reset_index(name="count")
    fig, ax = plt.subplots(figsize=(12, 7))
    sns.barplot(data=anomaly_counts, x="count", y="anomaly_type", ax=ax, color="#e63946")
    ax.set_title("Anomaly Distribution")
    save_plot(fig, "anomaly_distribution.png")
    report_figures.append(fig)

    fig, ax = plt.subplots(figsize=(12, 7))
    importance.sort_values().plot(kind="barh", ax=ax, color="#6a4c93")
    ax.set_title("Random Forest Feature Importance")
    ax.set_xlabel("Importance")
    save_plot(fig, PLOT_NAMES["feature_importance"])
    report_figures.append(fig)
    return report_figures


def create_report(data: pd.DataFrame, summary: pd.DataFrame, missing: pd.DataFrame,
                  train: pd.DataFrame, test: pd.DataFrame, importance: pd.Series,
                  figures: List[plt.Figure]) -> None:
    """Write a concise multi-page PDF report with findings and recommendations."""
    metrics = pd.read_csv(BASE_DIR / "model_baseline_metrics.csv").iloc[0]
    with PdfPages(REPORT_FILE) as pdf:
        fig = plt.figure(figsize=(11.7, 8.3))
        fig.text(0.08, 0.84, "ATM Cash Demand Exploratory Data Analysis", fontsize=24, weight="bold")
        fig.text(0.08, 0.76, "Dataset: ml_dataset_final.csv", fontsize=13)
        fig.text(0.08, 0.70, "Rows: {:,} | Columns: {} | Anomalies: {:,}".format(
            len(data), len(data.columns), int(data["anomaly"].sum())
        ), fontsize=12)
        recommendations = dedent("""
        Recommendations

        1. Model: start with gradient-boosted trees such as LightGBM or XGBoost for the final system.
           They capture nonlinear calendar, ATM-type, refill, and anomaly interactions efficiently.
           The included Random Forest is a transparent baseline and feature-importance reference.

        2. Preprocessing: keep the chronological split, sort by ATM and date, and fit all imputers,
           encoders, and scalers on the training period only. Log-transform highly skewed withdrawals,
           winsorise extreme values, and treat anomaly_type/severity as operational labels rather than
           target features unless they are known at prediction time.

        3. Accuracy: add real transaction history, regional weather, bank holidays, refill lead times,
           ATM outage logs, and cash-in-transit schedules. Use lag/rolling features at several horizons,
           tune with rolling time-series cross-validation, and evaluate MAE, RMSE, and service-level
           metrics such as stockout rate and excess-refill rate.
        """).strip()
        fig.text(0.08, 0.60, recommendations, fontsize=10.5, va="top", linespacing=1.45)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        for figure in figures:
            pdf.savefig(figure, bbox_inches="tight")

        fig = plt.figure(figsize=(11.7, 8.3))
        fig.text(0.06, 0.92, "EDA Tables and Baseline Split", fontsize=18, weight="bold")
        summary_text = summary[["count", "mean", "std", "min", "max", "missing_count"]].head(18).round(2).to_string()
        missing_text = missing.head(12).to_string(index=False)
        split_text = (
            "Train rows: {:,}\nTest rows: {:,}\nSplit date: {}\nMAE: {:,.2f}\nRMSE: {:,.2f}\n\n"
            "Top features:\n{}"
        ).format(
            len(train), len(test), metrics["split_date"], metrics["mae"], metrics["rmse"],
            importance.head(10).round(4).to_string(),
        )
        fig.text(0.04, 0.86, "Summary statistics", fontsize=12, weight="bold")
        fig.text(0.04, 0.84, summary_text, family="monospace", fontsize=6.5, va="top")
        fig.text(0.54, 0.86, "Missing-value report", fontsize=12, weight="bold")
        fig.text(0.54, 0.84, missing_text, family="monospace", fontsize=6.5, va="top")
        fig.text(0.04, 0.30, "Chronological split and baseline", fontsize=12, weight="bold")
        fig.text(0.04, 0.28, split_text, family="monospace", fontsize=8, va="top")
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)


def main() -> None:
    """Generate all EDA outputs."""
    PLOTS_DIR.mkdir(exist_ok=True)
    data = load_data()
    summary, missing, correlation = save_summary_tables(data)
    train, test, _, importance = save_train_test_split(data)
    figures = build_plots(data, correlation, importance)
    create_report(data, summary, missing, train, test, importance, figures)
    print("Generated EDA_Report.pdf, {} plot files, and ML train/test splits".format(len(list(PLOTS_DIR.glob("*.png")))))


if __name__ == "__main__":
    main()