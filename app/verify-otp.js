import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

export default function VerifyOTP() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [timerActive, setTimerActive] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();
  const inputRefs = useRef([]);

  // Load Montserrat fonts
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    const setOrientation = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
    setOrientation();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    let timer;
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerActive(false);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [timerActive, timeRemaining]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleInputChange = (text, index) => {
    const newOtp = [...otp];
    // Allow only numeric input
    const formattedText = text.replace(/[^0-9]/g, "");
    newOtp[index] = formattedText;

    setOtp(newOtp);

    // Auto-focus to next input
    if (formattedText && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setAlertMessage("Please enter all 6 digits of the OTP");
      setShowAlert(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlertMessage("OTP verified successfully!");
        setShowAlert(true);
        setTimeout(() => {
          router.replace("/login");
        }, 1000);
      } else {
        setAlertMessage(data.message || "Invalid OTP. Please try again.");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setAlertMessage("Something went wrong. Please try again.");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setTimeRemaining(120);
        setTimerActive(true);
        setAlertMessage("A new OTP has been sent to your email");
        setShowAlert(true);
      } else {
        setAlertMessage(
          data.message || "Failed to resend OTP. Please try again."
        );
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setAlertMessage("Something went wrong. Please try again.");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const showCustomAlert = () => {
    if (showAlert) {
      Alert.alert("OTP Verification", alertMessage, [
        { text: "OK", onPress: () => setShowAlert(false) },
      ]);
    }
  };

  if (showAlert) {
    showCustomAlert();
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/recruitment-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleInputChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  placeholder="•"
                  placeholderTextColor="#9DA3B4"
                />
              ))}
            </View>

            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                Time remaining: {formatTime(timeRemaining)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-outline"
                    size={20}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resendButton,
                { opacity: !timerActive || timeRemaining === 0 ? 1 : 0.5 },
              ]}
              onPress={handleResendOTP}
              disabled={timerActive && timeRemaining > 0}
            >
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    shadowColor: "#4a6da7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2A3453",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Montserrat_700Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#6A7290",
    marginBottom: 30,
    textAlign: "center",
    fontFamily: "Montserrat_400Regular",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: "#E1E8F5",
    borderRadius: 12,
    fontSize: 24,
    textAlign: "center",
    backgroundColor: "#F8FAFD",
    color: "#2A3453",
    fontFamily: "Montserrat_600SemiBold",
  },
  timerContainer: {
    marginBottom: 30,
  },
  timerText: {
    fontSize: 16,
    color: "#6A7290",
    fontFamily: "Montserrat_500Medium",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a6da7",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: "100%",
  },
  buttonIcon: {
    marginRight: 10,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat_600SemiBold",
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: "#4a6da7",
    fontSize: 16,
    fontFamily: "Montserrat_500Medium",
  },
});
