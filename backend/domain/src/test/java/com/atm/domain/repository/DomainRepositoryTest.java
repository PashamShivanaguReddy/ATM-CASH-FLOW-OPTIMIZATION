package com.atm.domain.repository;

import com.atm.domain.entity.Bank;
import com.atm.domain.entity.BankStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class DomainRepositoryTest {
    @Autowired private BankRepository bankRepository;

    @Test
    void savesAndFindsBankByUniqueCode() {
        Bank bank = new Bank();
        bank.setBankCode("DEV-001");
        bank.setName("Development Bank");
        bank.setStatus(BankStatus.ACTIVE);
        Bank saved = bankRepository.saveAndFlush(bank);

        Optional<Bank> found = bankRepository.findByBankCode("DEV-001");
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(found).isPresent().get().extracting(Bank::getName).isEqualTo("Development Bank");
    }

}
