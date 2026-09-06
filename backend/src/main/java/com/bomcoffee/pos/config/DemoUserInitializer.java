package com.bomcoffee.pos.config;

import com.bomcoffee.pos.user.entity.Role;
import com.bomcoffee.pos.user.entity.User;
import com.bomcoffee.pos.user.repository.RoleRepository;
import com.bomcoffee.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoUserInitializer implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "123456";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        upsert("admin", "Quản trị viên", "ADMIN", "0901234567", hash);
        upsert("kds", "Nhân viên pha chế", "BARTENDER", "0901234568", hash);
        upsert("waiter", "Nhân viên phục vụ", "WAITER", "0901234569", hash);
        upsert("cashier", "Thu ngân", "CASHIER", "0901234570", hash);
        log.info("Demo accounts ready. Password for admin/kds/waiter/cashier is {}", DEMO_PASSWORD);
    }

    private void upsert(String username, String fullName, String roleName, String phone, String hash) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Missing role: " + roleName));
        User user = userRepository.findByUsername(username).orElseGet(User::new);
        user.setUsername(username);
        user.setPasswordHash(hash);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setRole(role);
        user.setActive(true);
        userRepository.save(user);
    }
}
