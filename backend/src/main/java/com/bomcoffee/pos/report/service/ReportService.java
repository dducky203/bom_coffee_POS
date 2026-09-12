package com.bomcoffee.pos.report.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ReportService {
    Map<String, Object> getRevenue(LocalDate from, LocalDate to);
    List<Map<String, Object>> getTopProducts(LocalDate from, LocalDate to);
    List<Map<String, Object>> getRevenueByStaff(LocalDate from, LocalDate to);
    List<Map<String, Object>> getRevenueByPaymentMethod(LocalDate from, LocalDate to);
    List<Map<String, Object>> getRevenueByTableType(LocalDate from, LocalDate to);
    List<Map<String, Object>> getRevenueByService(LocalDate from, LocalDate to);
}
