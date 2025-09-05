package com.vr.portal.controller;

import com.vr.portal.entity.FileOperation;
import com.vr.portal.repository.FileOperationRepository;
import com.vr.portal.websocket.WebSocketService;
import org.apache.commons.io.IOUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin
public class FileController {
    
    private final FileOperationRepository fileOperationRepository;
    private final WebSocketService webSocketService;
    
    public FileController(FileOperationRepository fileOperationRepository, WebSocketService webSocketService) {
        this.fileOperationRepository = fileOperationRepository;
        this.webSocketService = webSocketService;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("agentId") String agentId,
            @RequestParam("targetPath") String targetPath,
            Authentication authentication
    ) {
        try {
            // Convert file to base64
            byte[] fileBytes = IOUtils.toByteArray(file.getInputStream());
            String base64Data = Base64.getEncoder().encodeToString(fileBytes);
            
            // Create file operation record
            FileOperation operation = new FileOperation(
                    agentId,
                    "upload",
                    targetPath + "/" + file.getOriginalFilename(),
                    getCurrentUserId(authentication)
            );
            fileOperationRepository.save(operation);
            
            // Send to agent via WebSocket
            Map<String, Object> message = Map.of(
                    "type", "file_upload",
                    "operationId", operation.getId(),
                    "targetPath", targetPath,
                    "fileName", file.getOriginalFilename(),
                    "fileData", base64Data
            );
            
            webSocketService.sendToAgent(agentId, message);
            
            return ResponseEntity.ok(Map.of(
                    "message", "File upload initiated",
                    "operationId", operation.getId()
            ));
            
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to upload file: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/download")
    public ResponseEntity<?> downloadFile(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String agentId = request.get("agentId");
        String filePath = request.get("filePath");
        
        // Create file operation record
        FileOperation operation = new FileOperation(
                agentId,
                "download",
                filePath,
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "file_download",
                "operationId", operation.getId(),
                "filePath", filePath
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "File download initiated",
                "operationId", operation.getId()
        ));
    }
    
    @PostMapping("/list")
    public ResponseEntity<?> listFiles(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String agentId = request.get("agentId");
        String directoryPath = request.get("directoryPath");
        
        // Create file operation record
        FileOperation operation = new FileOperation(
                agentId,
                "list",
                directoryPath,
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "file_list",
                "operationId", operation.getId(),
                "directoryPath", directoryPath
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "File list requested",
                "operationId", operation.getId()
        ));
    }
    
    @DeleteMapping("/{agentId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable String agentId,
            @RequestParam String filePath,
            Authentication authentication
    ) {
        // Create file operation record
        FileOperation operation = new FileOperation(
                agentId,
                "delete",
                filePath,
                getCurrentUserId(authentication)
        );
        fileOperationRepository.save(operation);
        
        // Send to agent via WebSocket
        Map<String, Object> message = Map.of(
                "type", "file_delete",
                "operationId", operation.getId(),
                "filePath", filePath
        );
        
        webSocketService.sendToAgent(agentId, message);
        
        return ResponseEntity.ok(Map.of(
                "message", "File deletion initiated",
                "operationId", operation.getId()
        ));
    }
    
    @GetMapping("/operations")
    public ResponseEntity<List<FileOperation>> getOperations() {
        List<FileOperation> operations = fileOperationRepository.findAllOrderByCreatedAtDesc();
        return ResponseEntity.ok(operations);
    }
    
    @GetMapping("/operations/{agentId}")
    public ResponseEntity<List<FileOperation>> getAgentOperations(@PathVariable String agentId) {
        List<FileOperation> operations = fileOperationRepository.findByAgentIdOrderByCreatedAtDesc(agentId);
        return ResponseEntity.ok(operations);
    }
    
    @PutMapping("/operations/{operationId}/complete")
    public ResponseEntity<?> completeOperation(
            @PathVariable Long operationId,
            @RequestBody Map<String, Object> result
    ) {
        FileOperation operation = fileOperationRepository.findById(operationId)
                .orElse(null);
        
        if (operation != null) {
            operation.setStatus((String) result.get("status"));
            operation.setCompletedAt(LocalDateTime.now());
            
            if (result.containsKey("error")) {
                operation.setErrorMessage((String) result.get("error"));
            }
            
            fileOperationRepository.save(operation);
            return ResponseEntity.ok(Map.of("message", "Operation updated"));
        }
        
        return ResponseEntity.notFound().build();
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        // This would typically extract user ID from authentication
        // For now, return a default value
        return 1L;
    }
}