import 'package:flutter/material.dart';
import 'routes.dart';
import '../theme/app_theme.dart';

class PatientApp extends StatelessWidget {
  const PatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CognivusLabs - Patient Monitor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: Routes.login,
      routes: Routes.routes,
    );
  }
}

