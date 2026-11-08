
package com.example.GhostCut;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FrameRepository frameRepository;

  
    @PostMapping("/projects")
    public Project createProject(@RequestBody Project project) {
        return projectRepository.save(project);
    }

    @GetMapping("/projects/latest")
    public ResponseEntity<Map<String, Object>> getLatestProject() {

        Optional<Project> latest =
                projectRepository.findTopByOrderByIdDesc();

        if (latest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = latest.get();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", project.getId());
        response.put("title", project.getTitle());
        response.put("platform", project.getPlatform());

        return ResponseEntity.ok(response);
    }

 
    @PostMapping("/frames/{projectId}")
    public ResponseEntity<Map<String, Object>> createFrame(
            @PathVariable Long projectId,
            @RequestBody Frame frame) {

        Optional<Project> project =
                projectRepository.findById(projectId);

        if (project.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        frame.setId(null);
        frame.setProject(project.get());

        Frame savedFrame = frameRepository.save(frame);

        return ResponseEntity.ok(convertFrameToMap(savedFrame));
    }

   
    @PutMapping("/frames/{projectId}/{frameId}")
    public ResponseEntity<Map<String, Object>> updateFrame(
            @PathVariable Long projectId,
            @PathVariable Long frameId,
            @RequestBody Frame updatedFrame) {

        Optional<Project> project =
                projectRepository.findById(projectId);

        Optional<Frame> existingFrame =
                frameRepository.findById(frameId);

        if (project.isEmpty() || existingFrame.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Frame frame = existingFrame.get();

        // Ensure the frame belongs to the requested project
        if (frame.getProject() == null ||
                !frame.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        frame.setContent(updatedFrame.getContent());
        frame.setSegmentType(updatedFrame.getSegmentType());
        frame.setDuration(updatedFrame.getDuration());

        Frame savedFrame = frameRepository.save(frame);

        return ResponseEntity.ok(convertFrameToMap(savedFrame));
    }

    
    @DeleteMapping("/frames/{projectId}/{frameId}")
    public ResponseEntity<?> deleteFrame(
            @PathVariable Long projectId,
            @PathVariable Long frameId) {

        Optional<Frame> existingFrame =
                frameRepository.findById(frameId);

        if (existingFrame.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Frame frame = existingFrame.get();

        if (frame.getProject() == null ||
                !frame.getProject().getId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }

        frameRepository.delete(frame);

        return ResponseEntity.ok(
                Map.of("message", "Frame deleted successfully"));
    }

  
    @GetMapping("/storyboard/{projectId}")
    public List<Map<String, Object>> getStoryboard(
            @PathVariable Long projectId) {

        List<Frame> frames =
                frameRepository.findByProjectId(projectId);

        List<Map<String, Object>> response = new ArrayList<>();

        for (Frame frame : frames) {
            response.add(convertFrameToMap(frame));
        }

        return response;
    }

    
    private Map<String, Object> convertFrameToMap(Frame frame) {

        Map<String, Object> frameData = new LinkedHashMap<>();

        frameData.put("id", frame.getId());
        frameData.put("segmentType", frame.getSegmentType());
        frameData.put("content", frame.getContent());
        frameData.put("duration", frame.getDuration());

        return frameData;
    }

    
    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<?> deleteProject(
            @PathVariable Long projectId) {

        if (!projectRepository.existsById(projectId)) {
            return ResponseEntity.notFound().build();
        }

        projectRepository.deleteById(projectId);

        return ResponseEntity.ok(
                Map.of("message",
                "Project and all frames deleted successfully"));
    }
}
 