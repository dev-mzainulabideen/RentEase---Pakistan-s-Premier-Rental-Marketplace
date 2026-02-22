/**
 * Full Calendar View Component
 * Displays a full calendar for availability selection
 */

class CalendarView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            minDate: options.minDate || new Date(),
            maxDate: options.maxDate || this.getMaxDate(),
            bookedDates: options.bookedDates || [],
            onDateSelect: options.onDateSelect || null,
            multiSelect: options.multiSelect || false,
            ...options
        };
        this.selectedDates = [];
        this.currentMonth = new Date();
        this.init();
    }

    getMaxDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + 12); // 12 months ahead
        return date;
    }

    init() {
        if (!this.container) return;
        this.render();
    }

    render() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        this.container.innerHTML = `
            <div class="calendar-wrapper">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" onclick="window.calendarInstance?.previousMonth()">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <h3 class="calendar-month-year">${this.getMonthName(month)} ${year}</h3>
                    <button class="calendar-nav-btn" onclick="window.calendarInstance?.nextMonth()">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
                <div class="calendar-weekdays">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                        `<div class="calendar-weekday">${day}</div>`
                    ).join('')}
                </div>
                <div class="calendar-days" id="calendar-days-${this.container.id}">
                    ${this.renderDays(year, month)}
                </div>
                ${this.options.multiSelect ? `
                <div class="calendar-footer">
                    <button class="btn btn-primary" onclick="window.calendarInstance?.clearSelection()">
                        Clear Selection
                    </button>
                    <button class="btn btn-success" onclick="window.calendarInstance?.confirmSelection()">
                        Confirm Dates
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        this.attachEventListeners();
    }

    renderDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let html = '';
        
        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            const isBooked = this.isBooked(dateStr);
            const isSelected = this.isSelected(dateStr);
            const isToday = this.isToday(date);

            let classes = 'calendar-day';
            if (isPast) classes += ' past';
            if (isBooked) classes += ' booked';
            if (isSelected) classes += ' selected';
            if (isToday) classes += ' today';

            html += `
                <div class="${classes}" 
                     data-date="${dateStr}"
                     ${!isPast && !isBooked ? `onclick="window.calendarInstance?.selectDate('${dateStr}')"` : ''}
                     title="${isBooked ? 'Booked' : isPast ? 'Past date' : 'Available'}">
                    ${day}
                </div>
            `;
        }

        return html;
    }

    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isBooked(dateStr) {
        return this.options.bookedDates.some(booking => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            const date = new Date(dateStr);
            return date >= checkIn && date < checkOut;
        });
    }

    isSelected(dateStr) {
        return this.selectedDates.includes(dateStr);
    }

    selectDate(dateStr) {
        if (this.options.multiSelect) {
            const index = this.selectedDates.indexOf(dateStr);
            if (index > -1) {
                this.selectedDates.splice(index, 1);
            } else {
                this.selectedDates.push(dateStr);
            }
        } else {
            this.selectedDates = [dateStr];
            if (this.options.onDateSelect) {
                this.options.onDateSelect(dateStr);
            }
        }
        this.render();
    }

    clearSelection() {
        this.selectedDates = [];
        this.render();
    }

    confirmSelection() {
        if (this.options.onDateSelect) {
            this.options.onDateSelect(this.selectedDates);
        }
    }

    previousMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.render();
    }

    attachEventListeners() {
        // Event listeners are attached via onclick in HTML
    }

    setBookedDates(dates) {
        this.options.bookedDates = dates;
        this.render();
    }
}

// CSS for calendar (should be in CSS file, but included here for convenience)
if (!document.getElementById('calendar-view-styles')) {
    const style = document.createElement('style');
    style.id = 'calendar-view-styles';
    style.textContent = `
        .calendar-wrapper {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .calendar-nav-btn {
            background: #f3f4f6;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .calendar-nav-btn:hover {
            background: #e5e7eb;
        }
        .calendar-month-year {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
        }
        .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .calendar-weekday {
            text-align: center;
            font-weight: 600;
            font-size: 0.875rem;
            color: #6b7280;
            padding: 0.5rem;
        }
        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
        }
        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }
        .calendar-day:not(.empty):not(.past):not(.booked):hover {
            background: #f3f4f6;
        }
        .calendar-day.past {
            color: #d1d5db;
            cursor: not-allowed;
        }
        .calendar-day.booked {
            background: #fee2e2;
            color: #dc2626;
            cursor: not-allowed;
        }
        .calendar-day.selected {
            background: #FF385C;
            color: white;
        }
        .calendar-day.today {
            border: 2px solid #FF385C;
        }
        .calendar-day.empty {
            visibility: hidden;
        }
        .calendar-footer {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            justify-content: flex-end;
        }
    `;
    document.head.appendChild(style);
}

