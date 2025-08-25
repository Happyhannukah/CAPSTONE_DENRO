import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Authentication logic can be added here
    router.push('/home');
  };

  return (
    <View style={styles.background}>
      {/* ✅ Separate logo background image */}
      <Image
        source={require('../assets/images/DENR.png')}
        style={styles.logo}
      />

      {/* ✅ Bottom-aligned transparent login container */}
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Enter your email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#666"
        />

        <TextInput
          placeholder="Enter your password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
    position: 'relative',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    width: width,
    height: height,
    resizeMode: 'contain', // Shrink without distortion
    opacity: 0.9,
    bottom: 160
    
  },
  container: {
  position: 'absolute',
  bottom: 50,
  left: 0,
  right: 0,
  height: 363,
  padding: 25,
  borderRadius: 20,                   
  overflow: 'hidden',                 
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 5,
},

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#005288',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
