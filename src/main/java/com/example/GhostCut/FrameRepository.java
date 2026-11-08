package com.example.GhostCut;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FrameRepository extends JpaRepository<Frame, Long> {
    List<Frame> findByProjectId(Long projectId);
}