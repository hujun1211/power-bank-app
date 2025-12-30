import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface Notification {
	id: string;
	title: string;
	description: string;
	time: string;
	type: 'info' | 'warning' | 'success';
	category: 'system' | 'device' | 'promotion';
	read: boolean;
}

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	deleteNotification: (id: string) => void;
	deleteAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
);

export const useNotifications = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			'useNotifications must be used within a NotificationProvider'
		);
	}
	return context;
};

const mockNotifications: Notification[] = [
	{
		id: '1',
		title: '充电完成',
		description: '您的充电宝已充满电，可以使用了',
		time: '2 小时前',
		type: 'success',
		category: 'device',
		read: false,
	},
	{
		id: '2',
		title: '低电量提醒',
		description: '您的便携电源电量已降至 20%，请及时充电',
		time: '4 小时前',
		type: 'warning',
		category: 'device',
		read: false,
	},
	{
		id: '3',
		title: '系统更新',
		description: '新版本已推出，点击更新获得更多功能',
		time: '1 天前',
		type: 'info',
		category: 'system',
		read: false,
	},
	{
		id: '4',
		title: '设备已连接',
		description: '新设备 便携电源 已成功连接',
		time: '2 天前',
		type: 'success',
		category: 'device',
		read: false,
	},
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [notifications, setNotifications] =
		useState<Notification[]>(mockNotifications);

	const unreadCount = notifications.filter((n) => !n.read).length;

	const markAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n))
		);
	};

	const markAllAsRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	};

	const deleteNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const deleteAllNotifications = () => {
		setNotifications([]);
	};

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				markAsRead,
				markAllAsRead,
				deleteNotification,
				deleteAllNotifications,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
};
