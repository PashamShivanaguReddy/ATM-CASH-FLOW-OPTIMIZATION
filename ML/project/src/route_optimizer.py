"""Optional route optimizer for grouping high-priority ATMs into a cash-van route."""
from datetime import datetime
from typing import Dict, Sequence

try:
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2
except Exception:
    pywrapcp = None
    routing_enums_pb2 = None


def build_route_plan(atm_payloads: Sequence[Dict[str, object]]) -> Dict[str, object]:
    """Group all ATMs that require service into the most efficient route plan."""
    high_priority = [payload for payload in atm_payloads if payload.get("risk_assessment", {}).get("priority") in {"HIGH", "CRITICAL"}]
    if not high_priority:
        return {
            "route_id": "HYD_ROUTE_01",
            "route_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "vehicle": "Cash Van 1",
            "vehicles": 0,
            "stops": [],
            "sequence": 0,
            "estimated_distance": 0.0,
            "estimated_time": "0h 00m",
            "optimizer": "no-service-required",
        }

    if pywrapcp is None or routing_enums_pb2 is None:
        ordered = sorted(
            high_priority,
            key=lambda payload: (
                payload.get("risk_assessment", {}).get("priority") == "CRITICAL",
                -float(payload.get("decision", {}).get("recommended_refill_amount", 0.0)),
            ),
            reverse=True,
        )
        route_stops = [payload["atm_id"] for payload in ordered]
        return {
            "route_id": "HYD_ROUTE_01",
            "route_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "vehicle": "Cash Van 1",
            "vehicles": 1,
            "stops": route_stops,
            "sequence": len(route_stops),
            "estimated_distance": round(float(len(route_stops) * 12.5), 1),
            "estimated_time": f"{max(1, len(route_stops))}h {min(59, len(route_stops)*15)}m",
            "optimizer": "heuristic-fallback",
        }

    manager = pywrapcp.RoutingIndexManager(len(high_priority), 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        from_priority = 1 if high_priority[from_node]["risk_assessment"]["priority"] == "CRITICAL" else 0
        to_priority = 1 if high_priority[to_node]["risk_assessment"]["priority"] == "CRITICAL" else 0
        return int((from_priority + to_priority) * 10 + abs(from_node - to_node))

    transit = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.time_limit.seconds = 2
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    solution = routing.SolveWithParameters(search_parameters)

    if solution is None:
        route_stops = [payload["atm_id"] for payload in high_priority]
        return {
            "route_id": "HYD_ROUTE_01",
            "route_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "vehicle": "Cash Van 1",
            "vehicles": 1,
            "stops": route_stops,
            "sequence": len(route_stops),
            "estimated_distance": round(float(len(route_stops) * 12.5), 1),
            "estimated_time": f"{max(1, len(route_stops))}h {min(59, len(route_stops)*15)}m",
            "optimizer": "heuristic-fallback",
        }

    route = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        route.append(high_priority[manager.IndexToNode(index)]["atm_id"])
        index = solution.Value(routing.NextVar(index))
    route.append(high_priority[manager.IndexToNode(index)]["atm_id"])

    return {
        "route_id": "HYD_ROUTE_01",
        "route_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "vehicle": "Cash Van 1",
        "vehicles": 1,
        "stops": route,
        "sequence": len(route),
        "estimated_distance": round(float(len(route) * 12.5), 1),
        "estimated_time": f"{max(1, len(route))}h {min(59, len(route)*15)}m",
        "optimizer": "ortools",
    }
