'use client';
import { INITIAL_EVENTS, INITIAL_RESOURCES, INITIAL_NOTICES, INITIAL_BUS_ROUTES, INITIAL_LOST_FOUND, INITIAL_COMPLAINTS, INITIAL_FAQS, INITIAL_REGISTRATIONS, DEMO_STUDENT, DEMO_ADMIN, } from './seedData';
// Helper for localStorage
function loadLocal(key, fallback) {
    if (typeof window === 'undefined')
        return fallback;
    try {
        const item = window.localStorage.getItem(`campusos_${key}`);
        return item ? JSON.parse(item) : fallback;
    }
    catch (e) {
        console.error(`Error loading ${key}:`, e);
        return fallback;
    }
}
function saveLocal(key, data) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(`campusos_${key}`, JSON.stringify(data));
    }
    catch (e) {
        console.error(`Error saving ${key}:`, e);
    }
}
export class CampusStore {
    // Auth
    static getCurrentUser() {
        return loadLocal('user', DEMO_STUDENT);
    }
    static setCurrentUser(user) {
        if (user) {
            saveLocal('user', user);
        }
        else {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('campusos_user');
            }
        }
    }
    static loginAs(role) {
        const user = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
        this.setCurrentUser(user);
        return user;
    }
    static logout() {
        this.setCurrentUser(null);
    }
    // Events
    static getEvents() {
        return loadLocal('events', INITIAL_EVENTS);
    }
    static getEventById(id) {
        return this.getEvents().find((e) => e.id === id);
    }
    static createEvent(eventData) {
        const events = this.getEvents();
        const newEvent = {
            ...eventData,
            id: `evt-${Date.now()}`,
            registeredCount: 0,
        };
        events.unshift(newEvent);
        saveLocal('events', events);
        return newEvent;
    }
    static deleteEvent(id) {
        const events = this.getEvents().filter((e) => e.id !== id);
        saveLocal('events', events);
    }
    // Event Registrations
    static getRegistrations() {
        return loadLocal('registrations', INITIAL_REGISTRATIONS);
    }
    static getUserRegistrations(userId) {
        return this.getRegistrations().filter((r) => r.userId === userId);
    }
    static isUserRegistered(eventId, userId) {
        return this.getRegistrations().some((r) => r.eventId === eventId && r.userId === userId);
    }
    static registerForEvent(eventId, user) {
        const event = this.getEventById(eventId);
        if (!event)
            return { success: false, message: 'Event not found.' };
        if (this.isUserRegistered(eventId, user.id)) {
            return { success: false, message: 'You are already registered for this event.' };
        }
        if (event.registeredCount >= event.capacity) {
            return { success: false, message: 'This event has reached full capacity.' };
        }
        const regCode = `CU-${event.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newReg = {
            id: `reg-${Date.now()}`,
            eventId,
            userId: user.id,
            registrationCode: regCode,
            checkedIn: false,
            registeredAt: new Date().toISOString(),
            userName: user.name,
            userStudentId: user.studentId,
        };
        const registrations = this.getRegistrations();
        registrations.push(newReg);
        saveLocal('registrations', registrations);
        // Update event registration count
        const events = this.getEvents().map((e) => e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e);
        saveLocal('events', events);
        return { success: true, message: 'Registration confirmed successfully!', registration: newReg };
    }
    static cancelRegistration(eventId, userId) {
        const registrations = this.getRegistrations().filter((r) => !(r.eventId === eventId && r.userId === userId));
        saveLocal('registrations', registrations);
        const events = this.getEvents().map((e) => e.id === eventId ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) } : e);
        saveLocal('events', events);
        return true;
    }
    static checkInRegistration(registrationCode) {
        const registrations = this.getRegistrations();
        const index = registrations.findIndex((r) => r.registrationCode.toUpperCase() === registrationCode.trim().toUpperCase());
        if (index === -1) {
            return { success: false, message: 'Invalid or nonexistent registration code.' };
        }
        if (registrations[index].checkedIn) {
            return { success: false, message: `Already checked in at ${new Date(registrations[index].checkedInAt).toLocaleTimeString()}` };
        }
        registrations[index].checkedIn = true;
        registrations[index].checkedInAt = new Date().toISOString();
        saveLocal('registrations', registrations);
        return { success: true, message: `Checked in: ${registrations[index].userName} (${registrations[index].userStudentId})`, reg: registrations[index] };
    }
    // Resources
    static getResources() {
        return loadLocal('resources', INITIAL_RESOURCES);
    }
    static getResourceById(id) {
        return this.getResources().find((r) => r.id === id);
    }
    static uploadResource(resourceData) {
        const resources = this.getResources();
        const newRes = {
            ...resourceData,
            id: `res-${Date.now()}`,
            createdAt: new Date().toISOString().split('T')[0],
            downloadCount: 1,
        };
        resources.unshift(newRes);
        saveLocal('resources', resources);
        return newRes;
    }
    static deleteResource(id) {
        const resources = this.getResources().filter((r) => r.id !== id);
        saveLocal('resources', resources);
    }
    static incrementDownload(id) {
        const resources = this.getResources().map((r) => r.id === id ? { ...r, downloadCount: r.downloadCount + 1 } : r);
        saveLocal('resources', resources);
    }
    // Notices
    static getNotices() {
        return loadLocal('notices', INITIAL_NOTICES);
    }
    static createNotice(noticeData) {
        const notices = this.getNotices();
        const newNotice = {
            ...noticeData,
            id: `not-${Date.now()}`,
            publishedDate: new Date().toISOString().split('T')[0],
        };
        notices.unshift(newNotice);
        saveLocal('notices', notices);
        return newNotice;
    }
    static deleteNotice(id) {
        const notices = this.getNotices().filter((n) => n.id !== id);
        saveLocal('notices', notices);
    }
    // Lost & Found
    static getLostFound() {
        return loadLocal('lostfound', INITIAL_LOST_FOUND);
    }
    static createLostFound(itemData) {
        const items = this.getLostFound();
        const newItem = {
            ...itemData,
            id: `lf-${Date.now()}`,
            resolved: false,
            createdAt: new Date().toISOString(),
        };
        items.unshift(newItem);
        saveLocal('lostfound', items);
        return newItem;
    }
    static toggleLostFoundResolved(id) {
        const items = this.getLostFound().map((item) => item.id === id ? { ...item, resolved: !item.resolved } : item);
        saveLocal('lostfound', items);
        return true;
    }
    static deleteLostFound(id) {
        const items = this.getLostFound().filter((i) => i.id !== id);
        saveLocal('lostfound', items);
    }
    // Complaints
    static getComplaints() {
        return loadLocal('complaints', INITIAL_COMPLAINTS);
    }
    static createComplaint(complaintData) {
        const complaints = this.getComplaints();
        const newCmp = {
            ...complaintData,
            id: `cmp-${Date.now()}`,
            status: 'Submitted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        complaints.unshift(newCmp);
        saveLocal('complaints', complaints);
        return newCmp;
    }
    static updateComplaintStatus(id, status, adminNote) {
        const complaints = this.getComplaints().map((c) => c.id === id
            ? {
                ...c,
                status,
                adminNote: adminNote !== undefined ? adminNote : c.adminNote,
                updatedAt: new Date().toISOString(),
            }
            : c);
        saveLocal('complaints', complaints);
        return true;
    }
    // Bus Routes
    static getBusRoutes() {
        return INITIAL_BUS_ROUTES;
    }
    // FAQs
    static getFAQs() {
        return INITIAL_FAQS;
    }
    // Reset demo data
    static resetDemoData() {
        if (typeof window === 'undefined')
            return;
        window.localStorage.removeItem('campusos_events');
        window.localStorage.removeItem('campusos_resources');
        window.localStorage.removeItem('campusos_notices');
        window.localStorage.removeItem('campusos_lostfound');
        window.localStorage.removeItem('campusos_complaints');
        window.localStorage.removeItem('campusos_registrations');
        window.localStorage.removeItem('campusos_user');
    }
}
