self.addEventListener('push', function (event) {
    if (event.data) {
        const data = JSON.parse(event.data.text());
        const options = {
            body: data.body,
            icon: '/logo.png', // Fallback to logo
            badge: '/logo.png',
            data: {
                url: data.url || '/'
            },
            // Vibrate pattern for mobile
            vibrate: [200, 100, 200, 100, 200, 100, 200]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                if (client.url !== event.notification.data.url) {
                    return client.navigate(event.notification.data.url).then(c => c.focus());
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
