// TRIP-DATA.JS - Trip data and segments

const TRIP_DATA = {
  title: 'Italy Trip 2027',
  destination: 'Sydney → Rome',
  startDate: '2027-08-01',
  endDate: '2027-08-28',
  nights: 32,
  budget: {
    total: 0,
    currency: 'AUD',
    categories: { accommodation: 0, flights: 0, food: 0, activities: 0, transport: 0, other: 0 }
  },
  flights: [],

  sections: [
    {
      id: 1,
      number: 1,
      name: 'Rome (Arrival)',
      nights: 2,
      startDate: '2027-08-01',
      endDate: '2027-08-02',
      cost: '$500-800',
      highlights: 'Colosseum, Roman Forum, Trastevere',
      location: '41.9028,12.4964',
      activities: [
        { id: 1, day: 1, priority: 1, durationHrs: 2, durationMins: 0,  time: '09:00', title: 'Colosseum tour', notes: 'Book skip-the-line tickets online', location: '41.8902,12.4923' },
        { id: 2, day: 1, priority: 2, durationHrs: 3, durationMins: 0,  time: '11:00', title: 'Roman Forum exploration', notes: 'Allow 2-3 hours for exploration', location: '41.8925,12.4858' },
        { id: 3, day: 2, priority: 1, durationHrs: 1, durationMins: 30, time: '19:00', title: 'Trastevere dinner', notes: 'Make reservations in advance', location: '41.8947,12.4667' }
      ],
      accommodations: [
        { id: 1, name: 'Hotel Artemide', checkIn: '2027-08-01', checkOut: '2027-08-02', cost: 'AUD $350/night', url: 'booking.com', location: '41.9012,12.4733' }
      ],
      transports: [
        { id: 1, type: 'Train', route: 'FCO → Rome centre', cost: '€16' }
      ]
    },
    {
      id: 2,
      number: 2,
      name: 'Naples + Pompeii',
      nights: 2,
      startDate: '2027-08-03',
      endDate: '2027-08-04',
      cost: '$300-500',
      highlights: 'Pompeii ruins, Mount Vesuvius, pizza',
      location: '40.8517,14.2681',
      activities: [
        { id: 1, day: 1, priority: 1, durationHrs: 3, durationMins: 0, time: '09:00', title: 'Pompeii guided tour', notes: 'Bring water and sun protection', location: '40.7505,14.6268' },
        { id: 2, day: 2, priority: 1, durationHrs: 2, durationMins: 0, time: '12:00', title: 'Mount Vesuvius hike', notes: '1-2 hour walk to crater', location: '40.8096,14.4268' }
      ],
      accommodations: [
        { id: 1, name: 'Hotel near station', checkIn: '2027-08-03', checkOut: '2027-08-04', cost: 'AUD $200/night', url: 'booking.com', location: '40.8541,14.2687' }
      ],
      transports: []
    },
    {
      id: 3,
      number: 3,
      name: 'Minori (Amalfi)',
      nights: 2,
      startDate: '2027-08-05',
      endDate: '2027-08-06',
      cost: '$400-600',
      highlights: 'Lemon Path hike, Roman Villa, beaches',
      location: '40.6309,14.4469',
      activities: [
        { id: 1, day: 1, priority: 1, durationHrs: 3, durationMins: 0,  time: '09:00', title: 'Lemon Path hike', notes: 'Sentiero dei Limoni - moderate difficulty', location: '40.6339,14.4502' },
        { id: 2, day: 2, priority: 1, durationHrs: 1, durationMins: 0,  time: '15:00', title: 'Roman Villa visit', notes: 'Small entrance fee €6', location: '40.6315,14.4475' }
      ],
      accommodations: [
        { id: 1, name: 'Hotel Miramare', checkIn: '2027-08-05', checkOut: '2027-08-06', cost: 'AUD $250/night', url: 'booking.com', location: '40.6309,14.4469' }
      ],
      transports: []
    },
    {
      id: 4,
      number: 4,
      name: 'Amalfi Town',
      nights: 3,
      startDate: '2027-08-07',
      endDate: '2027-08-09',
      cost: '$750-1050',
      highlights: 'Ravello villas, Capri island, boat tours',
      location: '40.6333,14.6022',
      activities: [],
      accommodations: [],
      transports: []
    },
    {
      id: 5,
      number: 5,
      name: 'La Barbera Praiano',
      nights: 2,
      startDate: '2027-08-10',
      endDate: '2027-08-11',
      cost: '$900',
      highlights: 'Path of the Gods hike, secluded beaches',
      location: '40.6253,14.3747',
      activities: [],
      accommodations: [],
      transports: []
    },
    {
      id: 6,
      number: 6,
      name: 'Tuscany Countryside',
      nights: 8,
      startDate: '2027-08-12',
      endDate: '2027-08-19',
      cost: '$2400-3600',
      highlights: 'Palio di Siena, Chianti wine, Florence',
      location: '43.3181,11.9260',
      activities: [],
      accommodations: [],
      transports: []
    },
    {
      id: 7,
      number: 7,
      name: 'Milan',
      nights: 2,
      startDate: '2027-08-20',
      endDate: '2027-08-21',
      cost: '$600-1000',
      highlights: 'Duomo, fashion district, galleries',
      location: '45.4642,9.1900',
      activities: [],
      accommodations: [],
      transports: []
    },
    {
      id: 8,
      number: 8,
      name: 'Lake Como',
      nights: 2,
      startDate: '2027-08-22',
      endDate: '2027-08-23',
      cost: '$500-800',
      highlights: 'Bellagio, boat tours, villas',
      location: '45.9724,9.2557',
      activities: [],
      accommodations: [],
      transports: []
    },
    {
      id: 9,
      number: 9,
      name: 'Venice',
      nights: 3,
      startDate: '2027-08-24',
      endDate: '2027-08-26',
      cost: '$1200-2100',
      highlights: 'St Mark\'s, gondolas, Murano & Burano',
      location: '45.4408,12.3155',
      activities: [],
      accommodations: [],
      transports: []
    },
    {
      id: 10,
      number: 10,
      name: 'Rome (Departure)',
      nights: 2,
      startDate: '2027-08-27',
      endDate: '2027-08-28',
      cost: '$500-800',
      highlights: 'Final explorations, shopping, dining',
      location: '41.9028,12.4964',
      activities: [],
      accommodations: [],
      transports: []
    }
  ]
};

// Trip manager class
class TripManager {
  constructor(data = TRIP_DATA) {
    this.data = data;
  }

  getSection(sectionId) {
    return this.data.sections.find(s => s.id === sectionId);
  }

  updateSection(sectionId, updates) {
    const section = this.getSection(sectionId);
    if (section) {
      Object.assign(section, updates);
      Storage.saveTripData(this.data);
      return section;
    }
    return null;
  }

  addActivity(sectionId, activity) {
    const section = this.getSection(sectionId);
    if (section) {
      section.activities.push(activity);
      Storage.saveTripData(this.data);
      return activity;
    }
    return null;
  }

  removeActivity(sectionId, activityId) {
    const section = this.getSection(sectionId);
    if (section) {
      section.activities = section.activities.filter(a => a.id !== activityId);
      Storage.saveTripData(this.data);
      return true;
    }
    return false;
  }

  updateActivity(sectionId, activityId, updates) {
    const section = this.getSection(sectionId);
    if (section) {
      const activity = section.activities.find(a => a.id === activityId);
      if (activity) {
        Object.assign(activity, updates);
        Storage.saveTripData(this.data);
        return activity;
      }
    }
    return null;
  }

  addAccommodation(sectionId, accommodation) {
    const section = this.getSection(sectionId);
    if (section) {
      section.accommodations.push(accommodation);
      Storage.saveTripData(this.data);
      return accommodation;
    }
    return null;
  }

  removeAccommodation(sectionId, accommodationId) {
    const section = this.getSection(sectionId);
    if (section) {
      section.accommodations = section.accommodations.filter(a => a.id !== accommodationId);
      Storage.saveTripData(this.data);
      return true;
    }
    return false;
  }

  getTotalCost() {
    return this.data.sections.reduce((total, section) => {
      const cost = parseInt(section.cost.split('-')[0].replace(/\D/g, ''));
      return total + cost;
    }, 0);
  }
}

// Global trip manager
const tripManager = new TripManager();

function createEmptyTrip(title, destination, startDate, endDate) {
  return {
    id: Date.now(),
    title: title || 'New Trip',
    destination: destination || 'TBD',
    startDate: startDate || '',
    endDate: endDate || '',
    nights: 0,
    budget: {
      total: 0,
      currency: 'AUD',
      categories: { accommodation: 0, flights: 0, food: 0, activities: 0, transport: 0, other: 0 }
    },
    flights: [],
    sections: []
  };
}
