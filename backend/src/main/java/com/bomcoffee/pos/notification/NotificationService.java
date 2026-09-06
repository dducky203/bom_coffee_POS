package com.bomcoffee.pos.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast tới KDS khi có món mới hoặc trạng thái món thay đổi
     */
    public void broadcastKdsUpdate(Object payload) {
        messagingTemplate.convertAndSend("/topic/kds", payload);
    }

    /**
     * Broadcast tới màn hình bàn khi trạng thái order của bàn thay đổi
     */
    public void broadcastTableUpdate(Long tableId, Object payload) {
        messagingTemplate.convertAndSend("/topic/orders/" + tableId, payload);
    }

    /**
     * Broadcast tới tất cả sơ đồ bàn khi trạng thái bàn thay đổi
     */
    public void broadcastTableStatusUpdate(Object payload) {
        messagingTemplate.convertAndSend("/topic/tables", payload);
    }
}
