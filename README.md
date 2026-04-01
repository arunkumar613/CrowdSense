# Crowd Sense 📱

Crowd Sense is a real-time mobile application built with React Native (Expo) and Firebase to help users monitor public location crowds, discover less-crowded alternative spots, and wait in virtual queues with priority support.

## Core Features
- **Real-time Crowd Updates:** Monitor crowds (Low, Medium, High) at common locations like Canteens, Libraries, and Hospitals.
- **Smart Alternative Recommendations:** If your chosen location is highly crowded, get instant recommendations for nearby alternatives of the same type with lower wait times.
- **Virtual Queue System:** Join a queue virtually instead of waiting physically in line. Includes a priority queue logic check.
- **Community Updates:** Users can submit their own crowd updates for locations.
- **Authentication:** Secure login and sign-up structure ready to be hooked to Firebase Auth.

---

## 🚀 Quick Setup & Deployment Guide

This project was built with React Native utilizing the **Expo** framework and **Firebase**.
Follow these steps to deploy and run it on your own machine.

### Prerequisites
Make sure you have Node.js installed, along with either iOS Simulator (Mac), Android Studio Emulator (Windows/Mac/Linux), or the **Expo Go** app on your physical smartphone.

### 1. Installation

1. Navigate to the project directory:
   ```bash
   cd CrowdSense
   ```

2. Install all necessary dependencies:
   ```bash
   npm install
   ```

### 2. Configure Firebase (Backend)

The app is currently structured with placeholder API keys to prevent crashes.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named "Crowd Sense".
3. Enable **Authentication** (Email/Password provider).
4. Enable **Firestore Database** (Start in test mode for development).
5. Go to Project Settings > General > "Your apps" section and add a Web App to get your config object.
6. Open the file `config/firebase.js` in this repository and replace the `firebaseConfig` variables with your real keys:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     // ... storageBucket, messagingSenderId, appId
   };
   ```

### 3. Running the App

Start the Expo development server:

```bash
npx expo start
```

- To run on your **physical device**, scan the QR code printed in the terminal using the Expo Go app (Android) or your Camera app (iOS).
- To run on an **Android Emulator**, press `a` in the terminal.
- To run on an **iOS Simulator** (Mac only), press `i` in the terminal.

### 4. Testing the Data

Since you will start with an empty Firestore database, the `src/services/mockDataService.js` is currently providing hardcoded data (`College Canteen`, `Central Library`, etc.) for you to view in the UI immediately without any extra setup. Once you're ready to read directly from Firestore, you can swap out the mock functions in that service file.

## Tech Stack
- React Native
- Expo
- React Navigation (Bottom Tabs, Native Stack)
- Firebase (Auth, Firestore)
- Expo Vector Icons
