package com.asms.booking;

import com.asms.booking.repository.BookingRepository;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.asms.booking.ManagerBookingRepositoryTest$SqlRecorder"
})
class ManagerBookingRepositoryTest {

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void clearRecordedSql() {
        SqlRecorder.clear();
    }

    @Test
    void nullableTimeFiltersAreExplicitlyTypedInGeneratedSql() {
        bookingRepository.searchForManager(null, null, null, null, null, PageRequest.of(0, 10));

        String select = SqlRecorder.statements().stream()
                .filter(sql -> sql.toLowerCase().contains(" from bookings "))
                .findFirst()
                .orElseThrow();

        long typedTimeParameters = Pattern.compile("cast\\(\\? as timestamp", Pattern.CASE_INSENSITIVE)
                .matcher(select)
                .results()
                .count();
        assertThat(typedTimeParameters).isEqualTo(2);
    }

    public static class SqlRecorder implements StatementInspector {
        private static final List<String> SQL = new CopyOnWriteArrayList<>();

        @Override
        public String inspect(String sql) {
            SQL.add(sql);
            return sql;
        }

        static List<String> statements() {
            return List.copyOf(SQL);
        }

        static void clear() {
            SQL.clear();
        }
    }
}
