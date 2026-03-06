package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Allow Angular to connect
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }
    
    @PutMapping("/{email}")
    public ResponseEntity<User> updateUser(@PathVariable String email, @RequestBody User userDetails) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        
        if (optionalUser.isPresent()) {
            User existingUser = optionalUser.get();
            // Update fields
            if (userDetails.getName() != null) existingUser.setName(userDetails.getName());
            if (userDetails.getAge() != null) existingUser.setAge(userDetails.getAge());
            if (userDetails.getHeight() != null) existingUser.setHeight(userDetails.getHeight());
            if (userDetails.getInitialWeight() != null) existingUser.setInitialWeight(userDetails.getInitialWeight());
            if (userDetails.getIsOnboarded() != null) existingUser.setIsOnboarded(userDetails.getIsOnboarded());
            
            User updatedUser = userRepository.save(existingUser);
            return ResponseEntity.ok(updatedUser);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
