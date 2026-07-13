package com.asms.catalog.service;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

@Component
public class ScheduleSchemaInitializer implements InitializingBean {

    private final ScheduleSchemaMigration migration;

    public ScheduleSchemaInitializer(
            ScheduleSchemaMigration migration,
            EntityManagerFactory entityManagerFactory
    ) {
        this.migration = migration;
    }

    @Override
    public void afterPropertiesSet() {
        if (migration.isRequired()) {
            migration.migrate();
        }
    }
}
