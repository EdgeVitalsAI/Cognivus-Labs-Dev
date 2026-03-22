import 'package:flutter/material.dart';

/// CognivusLabs Color Palette
/// Based on the dark theme design with blue accents
class AppColors {
  // Primary Background Colors
  static const Color background = Color(0xFF040719);
  static const Color backgroundLight = Color(0xFF0A0E23);
  static const Color cardBackground = Color(0xFF0D1229);
  static const Color cardBackgroundLight = Color(0xFF141B36);

  static const Color primary = Color(0xFF1E3A8A);      
  static const Color primaryLight = Color(0xFF3B82F6); 
  static const Color primaryDark = Color(0xFF1E40AF); 

  // Status Colors
  static const Color critical = Color(0xFFFF4444);
  static const Color criticalDark = Color(0xFFCC0000);
  static const Color warning = Color(0xFFFFAA00);
  static const Color warningLight = Color(0xFFFFCC00);
  static const Color success = Color(0xFF4CAF50);
  static const Color successLight = Color(0xFF66BB6A);

  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB0B8D1);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color textHint = Color(0xFF4B5563);

// Border & Divider Colors (Blue Theme)
  static const Color border = Color(0xFF1E3A8A); 
  static const Color borderLight = Color(0xFF3B82F6);
  static const Color divider = Color(0xFF1E40AF);

  // Gradient Colors (matching the design)
  static const List<Color> backgroundGradient = [
    Color(0xFF040719),
    Color(0xFF0A0E23),
  ];

  static const List<Color> primaryGradient = [
    Color(0xFF2323FF),
    Color(0xFF6E80E7),
  ];

  static const List<Color> cardGradient = [
    Color(0xFF0D1229),
    Color(0xFF141B36),
  ];

  // Vital Card Colors (matching dashboard design)
  static const Color heartRateColor = Color(0xFFFF6B6B);
  static const Color spo2Color = Color(0xFF4FC3F7);
  static const Color temperatureColor = Color(0xFFFFB347);
  static const Color bloodPressureColor = Color(0xFF9B59B6);

  // Sidebar Colors (Blue Theme)
  static const Color sidebarBackground = Color(0xFF0F172A); // Dark navy blue (clean base)
  static const Color sidebarItemActive = Color(0xFF2563EB); // Primary blue (highlight)
  static const Color sidebarItemHover = Color(0xFF1E293B);  // Slightly lighter hover state
  
  // Input Field Colors
  static const Color inputBackground = Color(0xFF0D1229);
  static const Color inputBorder = Color(0xFF2A3352);
  static const Color inputFocusBorder = Color(0xFF6E80E7);
}

