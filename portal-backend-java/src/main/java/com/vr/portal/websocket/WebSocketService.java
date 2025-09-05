package com.vr.portal.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebSocketService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final Map<String, String> agentSessions = new ConcurrentHashMap<>();
    
    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
    }
    
    public void registerAgent(String agentId, String sessionId) {
        agentSessions.put(agentId, sessionId);
        System.out.println("Agent registered: " + agentId + " with session: " + sessionId);
    }
    
    public void unregisterAgent(String agentId) {
        agentSessions.remove(agentId);
        System.out.println("Agent unregistered: " + agentId);
    }
    
    public boolean isAgentConnected(String agentId) {
        return agentSessions.containsKey(agentId);
    }
    
    public void sendToAgent(String agentId, Object message) {
        try {
            String destination = "/queue/agent/" + agentId;
            messagingTemplate.convertAndSend(destination, message);
            System.out.println("Message sent to agent " + agentId + ": " + objectMapper.writeValueAsString(message));
        } catch (Exception e) {
            System.err.println("Failed to send message to agent " + agentId + ": " + e.getMessage());
        }
    }
    
    public void broadcastToPortal(Object message) {
        try {
            messagingTemplate.convertAndSend("/topic/portal", message);
            System.out.println("Broadcast to portal: " + objectMapper.writeValueAsString(message));
        } catch (Exception e) {
            System.err.println("Failed to broadcast to portal: " + e.getMessage());
        }
    }
    
    public void sendToPortal(String topic, Object message) {
        try {
            messagingTemplate.convertAndSend("/topic/" + topic, message);
            System.out.println("Message sent to portal topic " + topic + ": " + objectMapper.writeValueAsString(message));
        } catch (Exception e) {
            System.err.println("Failed to send message to portal topic " + topic + ": " + e.getMessage());
        }
    }
}