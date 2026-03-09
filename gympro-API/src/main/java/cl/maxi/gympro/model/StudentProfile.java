package cl.maxi.gympro.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "student_profiles")
public class StudentProfile {
    @Id
    private String id;
    private String studentEmail;

    private String objective;
    private String biotype;

    // Antropometría general
    private String anthropometry;

    // Bioimpedancia médica
    private String bioimpedanceData;

    // Movilidad y Fuerza
    private String mobilityAnalysis;

    // Nutrición y Suplementación
    private String dietPlan;
    private String supplements;
    private String adjuncts;

    public StudentProfile() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getObjective() {
        return objective;
    }

    public void setObjective(String objective) {
        this.objective = objective;
    }

    public String getBiotype() {
        return biotype;
    }

    public void setBiotype(String biotype) {
        this.biotype = biotype;
    }

    public String getAnthropometry() {
        return anthropometry;
    }

    public void setAnthropometry(String anthropometry) {
        this.anthropometry = anthropometry;
    }

    public String getBioimpedanceData() {
        return bioimpedanceData;
    }

    public void setBioimpedanceData(String bioimpedanceData) {
        this.bioimpedanceData = bioimpedanceData;
    }

    public String getMobilityAnalysis() {
        return mobilityAnalysis;
    }

    public void setMobilityAnalysis(String mobilityAnalysis) {
        this.mobilityAnalysis = mobilityAnalysis;
    }

    public String getDietPlan() {
        return dietPlan;
    }

    public void setDietPlan(String dietPlan) {
        this.dietPlan = dietPlan;
    }

    public String getSupplements() {
        return supplements;
    }

    public void setSupplements(String supplements) {
        this.supplements = supplements;
    }

    public String getAdjuncts() {
        return adjuncts;
    }

    public void setAdjuncts(String adjuncts) {
        this.adjuncts = adjuncts;
    }
}
