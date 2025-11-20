package com.royal.grace.backend.controller;

import com.royal.grace.backend.model.Order;
import com.royal.grace.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable("id") String id) {
        return orderService.getOrderById(id);
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }

    @PatchMapping("/{id}")
    public Order updateOrder(@PathVariable("id") String id, @RequestBody Map<String, String> updates) {
        return orderService.updateOrder(id, updates);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable("id") String id) {
        orderService.deleteOrder(id);
    }
}
