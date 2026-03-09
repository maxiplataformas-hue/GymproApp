package cl.maxi.gympro.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "student_profiles")
public class StudentProfile {
    @Id
    private String id;
    private String studentEmail;

    // Evaluacion (Timestamps)
    private String recordDate;
    private String recordName;

    private String objective;
    private String biotype;

    // Advanced Numeric Bioimpedance
    private Double bodyFatPercentage;
    private Double muscleMassPercentage;
    private Double visceralFat;

    // Advanced Numeric Anthropometry (Growth)
    private Double chestCircumference;
    private Double waistCircumference;
    private Double leftArmCircumference;
    private Double rightArmCircumference;
    private Double leftLegCircumference;
    private Double rightLegCircumference;

    // Text Fallbacks & General Clinical Data
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

    public String getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(String recordDate) {
        this.recordDate = recordDate;
    }

    public String getRecordName() {
        return recordName;
    }

    public void setRecordName(String recordName) {
        this.recordName = recordName;
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

    public Double getBodyFatPercentage() {
        return bodyFatPercentage;
    }

    public void setBodyFatPercentage(Double bodyFatPercentage) {
        this.bodyFatPercentage = bodyFatPercentage;
    }

    public Double getMuscleMassPercentage() {
        return muscleMassPercentage;
    }

    public void setMuscleMassPercentage(Double muscleMassPercentage) {
        this.muscleMassPercentage = muscleMassPercentage;
    }

    public Double getVisceralFat() {
        return visceralFat;
    }

    public void setVisceralFat(Double visceralFat) {
        this.visceralFat = visceralFat;
    }

    public Double getChestCircumference() {
        return chestCircumference;
    }

    public void setChestCircumference(Double chestCircumference) {
        this.chestCircumference = chestCircumference;
    }

    public Double getWaistCircumference() {
        return waistCircumference;
    }

    public void setWaistCircumference(Double waistCircumference) {
        this.waistCircumference = waistCircumference;
    }

    public Double getLeftArmCircumference() {
        return leftArmCircumference;
    }

    public void setLeftArmCircumference(Double leftArmCircumference) {
        this.leftArmCircumference = leftArmCircumference;
    }

    public Double getRightArmCircumference() {
        return rightArmCircumference;
    }

    public void setRightArmCircumference(Double rightArmCircumference) {
        this.rightArmCircumference = rightArmCircumference;
    }

    public Double getLeftLegCircumference() {
        return leftLegCircumference;
    }

    public void setLeftLegCircumference(Double leftLegCircumference) {
        this.leftLegCircumference = leftLegCircumference;
    }

    public Double getRightLegCircumference() {
        return rightLegCircumference;
    }

    public void setRightLegCircumference(Double rightLegCircumference) {
        this.rightLegCircumference = rightLegCircumference;
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
