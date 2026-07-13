package com.asms.catalog.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class ScheduleSchemaMigration {

    static final String VERSION = "2026_07_14_schedule_capacity_v3";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public ScheduleSchemaMigration(DataSource dataSource) {
        this.dataSource = dataSource;
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public boolean isRequired() {
        Boolean schedulesExist = jdbcTemplate.queryForObject(
                "SELECT to_regclass('show_schedules') IS NOT NULL",
                Boolean.class
        );
        if (!Boolean.TRUE.equals(schedulesExist)) {
            return false;
        }

        Boolean markerTableExists = jdbcTemplate.queryForObject(
                "SELECT to_regclass('asms_schema_migrations') IS NOT NULL",
                Boolean.class
        );
        if (!Boolean.TRUE.equals(markerTableExists)) {
            return true;
        }

        Integer appliedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM asms_schema_migrations WHERE version = ?",
                Integer.class,
                VERSION
        );
        return appliedCount == null || appliedCount == 0;
    }

    public void migrate() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setSeparator("^^^");
        populator.addScript(new ClassPathResource("schema.sql"));
        populator.execute(dataSource);
    }
}
