package com.vr.portal.controller;

import com.vr.portal.entity.FileOperation;
import com.vr.portal.repository.FileOperationRepository;
import com.vr.portal.websocket.WebSocketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
@CrossOrigin
public class SystemController {
    
    private final FileOperationRepository fileOperationRepository;
    private final WebSocketService webSocketService;
    
    public SystemController(FileOperationRepository fileOperationRepository, WebSocketService webSocketService) {
        this.fileOperationRepository = fileOperationRepository;
        this.webSocketService = webSocketService;
    }
    
    @PostMapping("/execute")
    public ResponseEntity<?> executeCommand(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String agentId = request.get("agentId");
        String command = request.get("command");
        
        // Create file operation record for system command
        FileOperation operation = new FileOperation(
                agentId,
                "system_command",
                command,
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "system_command",
                "operationId", operation.getId(),
                "command", command
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "Command execution initiated",
                "operationId", operation.getId()
        ));
    }
    
    @PostMapping("/install")
    public ResponseEntity<?> installPackage(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String agentId = request.get("agentId");
        String packageName = request.get("packageName");
        String installCommand = request.get("installCommand");
        
        // Create file operation record for package installation
        FileOperation operation = new FileOperation(
                agentId,
                "install_package",
                packageName,
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "install_package",
                "operationId", operation.getId(),
                "packageName", packageName,
                "installCommand", installCommand
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "Package installation initiated",
                "operationId", operation.getId()
        ));
    }
    
    @PostMapping("/info")
    public ResponseEntity<?> getSystemInfo(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String agentId = request.get("agentId");
        
        // Create file operation record for system info
        FileOperation operation = new FileOperation(
                agentId,
                "system_info",
                "system_info",
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "system_info",
                "operationId", operation.getId()
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "System info requested",
                "operationId", operation.getId()
        ));
    }
    
    @PostMapping("/restart-agent")
    public ResponseEntity<?> restartAgent(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String agentId = request.get("agentId");
        
        // Create file operation record for agent restart
        FileOperation operation = new FileOperation(
                agentId,
                "restart_agent",
                "restart_agent",
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "restart_agent",
                "operationId", operation.getId()
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "Agent restart initiated",
                "operationId", operation.getId()
        ));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        // This would typically extract user ID from authentication
        // For now, return a default value
        return 1L;
    }
}