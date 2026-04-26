# Italy Trip 2027 - Travel Web Portal

A complete travel planning web application with AI-powered itinerary planning, interactive maps, and automated booking management.

## Features

✨ **Complete Trip Planning**
- 32-night itinerary across 10 Italian destinations
- Detailed activities, accommodations, and transport planning
- Real-time cost tracking and budget management
- Edit and customize all trip details

🤖 **AI-Powered Travel Agent Bot**
- Chat with Claude AI for personalized travel recommendations
- Activity suggestions, restaurant recommendations, flight price checks
- Auto-update itinerary from bot suggestions
- Undo/redo functionality for safe experimentation
- Multi-language support

🗺️ **Interactive Maps**
- Google Maps integration for all activities and accommodations
- Location search and pinning
- Map view for each trip section with activity sidebar
- Real-time location updates

📱 **Responsive Design**
- Works on desktop, tablet, and mobile devices
- Clean, intuitive UI with dark mode support
- Real-time data synchronization
- Smooth animations and transitions

💾 **Data Management**
- Local storage with automatic persistence
- Export/import in CSV and JSON formats
- Backup and recovery options
- Cloud sync ready (Firebase/MongoDB compatible)

🔌 **Third-Party Integrations**
- Claude AI API for travel planning
- Google Maps API for interactive maps
- Gmail API for flight alerts (configured but not implemented)
- Telegram Bot for notifications (configured but not implemented)
- Skyscanner API for flight pricing (configured but not implemented)

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Claude API key from [console.anthropic.com](https://console.anthropic.com)
- Google Maps API key (optional, for maps feature)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mosscow/travel-web-portal.git
cd travel-web-portal
```

2. Open in browser:
```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js
npx http-server

# Option 3: Direct file opening
# Open index.html directly in your browser
```

3. Configure API Keys:
   - Go to Settings tab
   - Paste your Claude API key
   - Click "Save API Key"
   - Test connection with "Test Connection" button

## Usage

### Trip Planner Tab
1. Click on any destination card (1-10) to view details
2. Manage activities with time, title, and notes
3. View accommodations and transport
4. Check interactive map with all locations pinned
5. Export trip data as CSV or JSON

### Travel Agent Bot Tab
1. Ensure Claude API key is configured in Settings
2. Ask questions about:
   - Activities and attractions
   - Restaurants and dining
   - Flight prices and options
   - Itinerary planning
   - Local tips and advice
3. Click "Apply to itinerary" to update trip
4. Use "Undo" to revert changes
5. Export chat history for reference

### Settings Tab
- Configure Claude API key
- Configure Google Maps API key
- Set bot personality and response style
- Enable/disable auto-features
- Export/import trip data
- Reset all data (with confirmation)

## Project Structure

```
travel-web-portal/
├── index.html              # Main HTML file
├── styles/
│   ├── global.css         # Global styles
│   ├── trip-planner.css   # Trip planner styles
│   └── chat.css           # Chat interface styles
├── js/
│   ├── config.js          # Configuration and constants
│   ├── api.js             # API integration
│   ├── storage.js         # Local storage management
│   ├── trip-data.js       # Trip data and segments
│   ├── ui-components.js   # Reusable UI components
│   ├── main.js            # App initialization
│   ├── travel-agent-bot.js # Bot functionality
│   └── settings.js        # Settings management
├── README.md              # This file
├── SETUP.md              # Detailed setup instructions
├── API_CONFIG.md         # API configuration guide
└── .gitignore            # Git ignore file
```

## API Configuration

### Claude API
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create a new API key
3. Paste in Settings tab > Claude API Configuration
4. Test connection

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Maps JavaScript API, Geocoding API, Places API
4. Create an API key
5. Paste in Settings tab > Google Maps API

## Development

### Adding New Features
1. Create feature branch: `git checkout -b feature/your-feature`
2. Update relevant JS files in `js/` folder
3. Test thoroughly in all sections
4. Submit pull request

### File Organization
- `js/config.js` - Add new constants
- `js/api.js` - Add new API methods
- `js/storage.js` - Add new storage methods
- `js/ui-components.js` - Add new UI components
- `styles/` - Update CSS as needed

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Format

### Trip Data Structure
```javascript
{
  title: "Italy Trip 2027",
  sections: [
    {
      id: 1,
      name: "Rome (Arrival)",
      nights: 2,
      activities: [...],
      accommodations: [...],
      transports: [...]
    },
    // ... more sections
  ]
}
```

### Export Formats
- **CSV**: Tabular format for spreadsheets
- **JSON**: Complete data structure for backup/restore

## Keyboard Shortcuts
- `Enter` in chat input - Send message
- `Shift+Enter` in chat - New line
- Click destination cards - Switch sections
- Click segment tabs - Switch views

## Troubleshooting

### Claude API Not Working
- Verify API key is correct
- Check API key has permissions
- Try "Test Connection" button
- Check browser console for errors

### Google Maps Not Displaying
- Verify Google Maps API key is set
- Enable required APIs in Google Cloud Console
- Check API quotas aren't exceeded

### Data Not Saving
- Check localStorage is enabled
- Try exporting data as backup
- Clear cache and try again
- Check browser storage quota

## Performance

- Lightweight (~100KB total)
- No external frameworks required
- Fast load times
- Optimized for mobile devices
- Efficient data management

## Security

- API keys stored in localStorage (consider environment variables for production)
- HTTPS recommended for production
- No sensitive data sent to third parties
- Data encrypted before cloud sync (if implemented)

## Future Enhancements

- [ ] Real Skyscanner/Google Flights integration
- [ ] Gmail email parsing for flight alerts
- [ ] Telegram bot notifications
- [ ] Multi-user collaboration
- [ ] Mobile app version
- [ ] Offline mode with service workers
- [ ] Social sharing features
- [ ] Advanced analytics

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## Support

For issues and questions:
- Create GitHub issue
- Check documentation
- Review existing discussions

## Changelog

### v2.0.0 (2026-04)
- Complete Travel Agent Bot integration with Claude AI
- Interactive map views with location pins
- Settings management system
- CSV/JSON export functionality
- Real-time activity editing
- Undo/redo for changes
- Multi-section navigation

### v1.0.0 (2026-03)
- Initial release
- Basic trip planning
- Activity management
- Accommodation tracking

## Author

Built with ❤️ for travelers planning their perfect Italy trip

GitHub: [@mosscow](https://github.com/mosscow)

---

**Happy travels! 🇮🇹 ✈️**
