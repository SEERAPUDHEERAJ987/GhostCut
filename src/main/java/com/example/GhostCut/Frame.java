package com.example.GhostCut; 
import jakarta.persistence.*;

@Entity
public class Frame {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
    private String segmentType; // Visual Hook, Core Value, CTA
    private Double duration;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSegmentType() { return segmentType; }
    public void setSegmentType(String segmentType) { this.segmentType = segmentType; }
    public Double getDuration() { return duration; }
    public void setDuration(Double duration) { this.duration = duration; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}