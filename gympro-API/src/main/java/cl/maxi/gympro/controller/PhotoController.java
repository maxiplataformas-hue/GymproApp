package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.StudentPhoto;
import cl.maxi.gympro.repository.PhotoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/photos")
@CrossOrigin(origins = "*")
public class PhotoController {

    @Autowired
    private PhotoRepository photoRepository;

    @GetMapping("/{studentEmail}")
    public List<StudentPhoto> getPhotosByStudent(@PathVariable String studentEmail) {
        return photoRepository.findByStudentEmailOrderByDateDesc(studentEmail);
    }

    @PostMapping
    public StudentPhoto savePhoto(@RequestBody StudentPhoto photo) {
        return photoRepository.save(photo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable String id) {
        if (photoRepository.existsById(id)) {
            photoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
