import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.inner} behavior="padding">
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>Luciérnaga</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@empresa.com"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.btn, (loading || !email.trim() || !password) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>Iniciar sesión</Text>
          }
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 12 },
  title: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 36 },
  errorBox: {
    backgroundColor: COLORS.error + '22',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: COLORS.error, fontSize: 13 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
