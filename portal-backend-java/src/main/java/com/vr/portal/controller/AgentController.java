package com.vr.portal.controller;

import com.vr.portal.entity.Agent;
import com.vr.portal.repository.AgentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin
public class AgentController {
    
    private final AgentRepository agentRepository;
    
    public AgentController(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }
    
    @GetMapping
    public ResponseEntity<List<Agent>> getAllAgents() {
        List<Agent> agents = agentRepository.findAll();
        return ResponseEntity.ok(agents);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Agent> getAgent(@PathVariable String id) {
        Optional<Agent> agent = agentRepository.findById(id);
        return agent.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> registerAgent(@RequestBody Agent agent) {
        try {
            agent.setStatus("online");
            agent.setLastSeen(LocalDateTime.now());
            
            Agent savedAgent = agentRepository.save(agent);
            return ResponseEntity.ok(Map.of(
                    "message", "Agent registered successfully",
                    "agent", savedAgent
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to register agent: " + e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}/heartbeat")
    public ResponseEntity<?> updateHeartbeat(@PathVariable String id) {
        Optional<Agent> optionalAgent = agentRepository.findById(id);
        
        if (optionalAgent.isPresent()) {
            Agent agent = optionalAgent.get();
            agent.setStatus("online");
            agent.setLastSeen(LocalDateTime.now());
            agentRepository.save(agent);
            
            return ResponseEntity.ok(Map.of("message", "Heartbeat updated"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> statusUpdate) {
        Optional<Agent> optionalAgent = agentRepository.findById(id);
        
        if (optionalAgent.isPresent()) {
            Agent agent = optionalAgent.get();
            agent.setStatus(statusUpdate.get("status"));
            agent.setLastSeen(LocalDateTime.now());
            agentRepository.save(agent);
            
            return ResponseEntity.ok(Map.of("message", "Status updated"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeAgent(@PathVariable String id) {
        if (agentRepository.existsById(id)) {
            agentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Agent removed successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<?> getAgentStats() {
        long totalAgents = agentRepository.count();
        long onlineAgents = agentRepository.countOnlineAgents();
        long offlineAgents = totalAgents - onlineAgents;
        
        return ResponseEntity.ok(Map.of(
                "total", totalAgents,
                "online", onlineAgents,
                "offline", offlineAgents
        ));
    }
}