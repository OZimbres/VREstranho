package com.vr.portal.repository;

import com.vr.portal.entity.FileOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileOperationRepository extends JpaRepository<FileOperation, Long> {
    List<FileOperation> findByAgentIdOrderByCreatedAtDesc(String agentId);
    List<FileOperation> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FileOperation> findByStatusOrderByCreatedAtDesc(String status);
    
    @Query("SELECT f FROM FileOperation f ORDER BY f.createdAt DESC")
    List<FileOperation> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT COUNT(f) FROM FileOperation f WHERE f.status = 'completed'")
    long countSuccessfulOperations();
    
    @Query("SELECT COUNT(f) FROM FileOperation f WHERE f.status = 'failed'")
    long countFailedOperations();
}