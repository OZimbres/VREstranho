package com.vr.portal.websocket;

import com.vr.portal.entity.Agent;
import com.vr.portal.repository.AgentRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class WebSocketController {
    
    private final WebSocketService webSocketService;
    private final AgentRepository agentRepository;
    
    public WebSocketController(WebSocketService webSocketService, AgentRepository agentRepository) {
        this.webSocketService = webSocketService;
        this.agentRepository = agentRepository;
    }
    
    @MessageMapping("/agent/connect")
    @SendToUser("/queue/reply")
    public Map<String, Object> handleAgentConnect(@Payload Map<String, Object> message) {
        try {
            String agentId = (String) message.get("agentId");
            String sessionId = (String) message.get("sessionId");
            
            // Register agent session
            webSocketService.registerAgent(agentId, sessionId);
            
            // Update agent status
            agentRepository.findById(agentId).ifPresent(agent -> {
                agent.setStatus("online");
                agent.setLastSeen(LocalDateTime.now());
                agentRepository.save(agent);
            });
            
            // Broadcast agent status change
            webSocketService.broadcastToPortal(Map.of(
                    "type", "agent_status_change",
                    "agentId", agentId,
                    "status", "online"
            ));
            
            return Map.of("status", "connected", "message", "Agent registered successfully");
            
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
    
    @MessageMapping("/agent/disconnect")
    public void handleAgentDisconnect(@Payload Map<String, Object> message) {
        try {
            String agentId = (String) message.get("agentId");
            
            // Unregister agent session
            webSocketService.unregisterAgent(agentId);
            
            // Update agent status
            agentRepository.findById(agentId).ifPresent(agent -> {
                agent.setStatus("offline");
                agent.setLastSeen(LocalDateTime.now());
                agentRepository.save(agent);
            });
            
            // Broadcast agent status change
            webSocketService.broadcastToPortal(Map.of(
                    "type", "agent_status_change",
                    "agentId", agentId,
                    "status", "offline"
            ));
            
        } catch (Exception e) {
            System.err.println("Error handling agent disconnect: " + e.getMessage());
        }
    }
    
    @MessageMapping("/agent/response")
    public void handleAgentResponse(@Payload Map<String, Object> response) {
        try {
            // Forward agent response to portal
            webSocketService.broadcastToPortal(Map.of(
                    "type", "agent_response",
                    "data", response
            ));
            
        } catch (Exception e) {
            System.err.println("Error handling agent response: " + e.getMessage());
        }
    }
}