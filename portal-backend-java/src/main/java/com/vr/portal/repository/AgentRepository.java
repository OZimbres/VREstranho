package com.vr.portal.repository;

import com.vr.portal.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgentRepository extends JpaRepository<Agent, String> {
    List<Agent> findByStatus(String status);
    List<Agent> findByNetworkId(String networkId);
    List<Agent> findByStoreId(String storeId);
    
    @Query("SELECT COUNT(a) FROM Agent a WHERE a.status = 'online'")
    long countOnlineAgents();
    
    @Query("SELECT a FROM Agent a WHERE a.lastSeen < :threshold")
    List<Agent> findStaleAgents(LocalDateTime threshold);
}