import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

const { width, height } = Dimensions.get("window");

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

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
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    };
    setOrientation();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    if (password.length > 0) {
      setPasswordError("");
    }
  }, [password]);

  useEffect(() => {
    if (email.length > 0) {
      setEmailError("");
    }
  }, [email]);

  const handleOutsidePress = () => {
    // Function to dismiss keyboard when user taps outside the input
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleRegister = async () => {
    // Check if any required field is empty
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !age.trim() ||
      !company.trim() ||
      !position.trim() ||
      !department.trim()
    ) {
      setAlertMessage("All fields are required");
      setShowAlert(true);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    } else {
      setEmailError("");
    }

    // Validate password strength
    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    } else {
      setPasswordError("");
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match");
      setShowAlert(true);
      return;
    }

    // All validations passed, proceed with registration
    setIsLoading(true);

    // Here you would typically make an API call to register the user
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          age,
          gender,
          company,
          position,
          department,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        console.log("Registration successful");
        router.push({
          pathname: "/verify-otp",
          params: { email },
        });
      } else {
        // Registration failed
        setAlertMessage(data.message || "Registration failed");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setAlertMessage("Something went wrong. Please try again.");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push("/login");
  };

  const showCustomAlert = () => {
    if (showAlert) {
      Alert.alert("Registration Error", alertMessage, [
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
          <View style={styles.mainContainer}>
            {/* Left side: SVG illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../assets/login.svg")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Right side: Registration form */}
            <View style={styles.formWrapper}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/recruitment-logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Create Account</Text>
                <Text style={styles.formSubtitle}>
                  Register to access the HR recruitment portal
                </Text>

                <ScrollView contentContainerStyle={styles.formScrollContent}>
                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Full Name"
                          value={name}
                          onChangeText={setName}
                          placeholderTextColor="#9DA3B4"
                        />
                      </View>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Email Address"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          placeholderTextColor="#9DA3B4"
                        />
                      </View>
                      {emailError ? (
                        <Text style={styles.errorText}>{emailError}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Password"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          placeholderTextColor="#9DA3B4"
                        />
                        <TouchableOpacity
                          style={styles.eyeIconContainer}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={20}
                            color="#777"
                          />
                        </TouchableOpacity>
                      </View>
                      {passwordError ? (
                        <Text style={styles.errorText}>{passwordError}</Text>
                      ) : null}
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          placeholderTextColor="#9DA3B4"
                        />
                        <TouchableOpacity
                          style={styles.eyeIconContainer}
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          <Ionicons
                            name={
                              showConfirmPassword
                                ? "eye-off-outline"
                                : "eye-outline"
                            }
                            size={20}
                            color="#777"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Age"
                          value={age}
                          onChangeText={setAge}
                          keyboardType="numeric"
                          placeholderTextColor="#9DA3B4"
                        />
                      </View>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.pickerContainer}>
                        <Ionicons
                          name="people-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <Picker
                          selectedValue={gender}
                          style={styles.picker}
                          onValueChange={(itemValue) => setGender(itemValue)}
                        >
                          <Picker.Item label="Male" value="male" />
                          <Picker.Item label="Female" value="female" />
                          <Picker.Item label="Other" value="other" />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="business-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Company"
                          value={company}
                          onChangeText={setCompany}
                          placeholderTextColor="#9DA3B4"
                        />
                      </View>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="briefcase-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Position"
                          value={position}
                          onChangeText={setPosition}
                          placeholderTextColor="#9DA3B4"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="git-branch-outline"
                          size={20}
                          color="#4a6da7"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Department"
                          value={department}
                          onChangeText={setDepartment}
                          placeholderTextColor="#9DA3B4"
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="person-add-outline"
                          size={20}
                          color="#fff"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.registerButtonText}>Register</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.loginPrompt}>
                    <Text style={styles.loginPromptText}>
                      Already have an account?
                    </Text>
                    <TouchableOpacity onPress={navigateToLogin}>
                      <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
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
  },
  mainContainer: {
    flex: 1,
    flexDirection: "row",
    height: height,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    padding: 20,
  },
  illustration: {
    width: "100%",
    height: "80%",
  },
  formWrapper: {
    flex: 1.5,
    justifyContent: "center",
    padding: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    shadowColor: "#4a6da7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 600,
  },
  formScrollContent: {
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2A3453",
    marginBottom: 10,
    fontFamily: "Montserrat_700Bold",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#6A7290",
    marginBottom: 20,
    fontFamily: "Montserrat_400Regular",
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E8F5",
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#F8FAFD",
    overflow: "hidden",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E8F5",
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#F8FAFD",
    overflow: "hidden",
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 15,
    fontSize: 16,
    color: "#2A3453",
    fontFamily: "Montserrat_400Regular",
  },
  picker: {
    flex: 1,
    height: 50,
    color: "#2A3453",
    fontFamily: "Montserrat_400Regular",
  },
  eyeIconContainer: {
    padding: 15,
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    marginBottom: 5,
    fontFamily: "Montserrat_400Regular",
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a6da7",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat_600SemiBold",
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPromptText: {
    color: "#6A7290",
    fontSize: 15,
    marginRight: 5,
    fontFamily: "Montserrat_400Regular",
  },
  loginLink: {
    color: "#4a6da7",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Montserrat_600SemiBold",
  },
  // Responsive styles for mobile
  "@media (max-width: 768px)": {
    mainContainer: {
      flexDirection: "column",
    },
    illustrationContainer: {
      display: "none",
    },
    formWrapper: {
      padding: 20,
    },
    formRow: {
      flexDirection: "column",
    },
  },
});
