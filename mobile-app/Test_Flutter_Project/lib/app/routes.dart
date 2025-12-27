import 'package:flutter/material.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';

class Routes {
  static const login = '/';
  static const dashboard = '/dashboard';

  static Map<String, WidgetBuilder> routes = {
    login: (_) => const LoginScreen(),
    dashboard: (_) => const DashboardScreen(),
  };
}

