package com.royal.grace.backend.service;

import com.royal.grace.backend.model.Order;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OrderService {
    
    private final Map<String, Order> orderDatabase = new ConcurrentHashMap<>();

    public List<Order> getAllOrders() {
        return new ArrayList<>(orderDatabase.values());
    }

    public Order getOrderById(String id) {
        return orderDatabase.get(id);
    }

    public Order createOrder(Order order) {
        if (order.getId() == null || order.getId().isEmpty()) {
            order.setId(UUID.randomUUID().toString());
        }
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        
        if (order.getPaymentStatus() == null) {
            order.setPaymentStatus("pending");
        }
        if (order.getFulfillmentStatus() == null) {
            order.setFulfillmentStatus("pending");
        }
        
        orderDatabase.put(order.getId(), order);
        return order;
    }

    public Order updateOrder(String id, Map<String, String> updates) {
        Order order = orderDatabase.get(id);
        if (order == null) {
            throw new RuntimeException("Order not found");
        }

        if (updates.containsKey("paymentStatus")) {
            order.setPaymentStatus(updates.get("paymentStatus"));
        }
        if (updates.containsKey("fulfillmentStatus")) {
            order.setFulfillmentStatus(updates.get("fulfillmentStatus"));
        }

        order.setUpdatedAt(Instant.now());
        orderDatabase.put(id, order);
        return order;
    }

    public void deleteOrder(String id) {
        orderDatabase.remove(id);
    }
}
