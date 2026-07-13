package com.asms.catalog.service;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
public class ScheduleSchemaInitializer implements InitializingBean {

    private final DataSource dataSource;

    public ScheduleSchemaInitializer(DataSource dataSource, EntityManagerFactory entityManagerFactory) {
        this.dataSource = dataSource;
    }

    @Override
    public void afterPropertiesSet() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setSeparator("^^^");
        populator.addScript(new ClassPathResource("schema.sql"));
        populator.execute(dataSource);
    }
}
