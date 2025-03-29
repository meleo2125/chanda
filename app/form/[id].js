import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { API_URL } from "../../api/config";
import { useLocalSearchParams, router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import CheckBox from "@react-native-community/checkbox";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

export default function PublicForm() {
  const { id } = useLocalSearchParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [date, setDate] = useState(null);

  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/forms/public/${id}`);
      const data = await response.json();

      if (response.ok) {
        setForm(data.form);

        // Initialize responses object
        const initialResponses = {};
        data.form.fields.forEach((field) => {
          if (field.type === "checkbox") {
            initialResponses[field.id] = false;
          } else {
            initialResponses[field.id] = "";
          }
        });
        setResponses(initialResponses);
      } else {
        Alert.alert("Error", "Form not found");
      }
    } catch (error) {
      console.error("Error fetching form:", error);
      Alert.alert("Error", "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (fieldId, value) => {
    setResponses((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && dateField) {
      setResponses((prev) => ({
        ...prev,
        [dateField]: selectedDate.toISOString().split("T")[0],
      }));
    }
  };

  const showDatepickerForField = (fieldId) => {
    setDateField(fieldId);
    setShowDatePicker(true);
  };

  const pickResume = async () => {
    try {
      console.log("Opening document picker...");
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      console.log("Document picker result:", JSON.stringify(result));

      if (
        result.canceled === false &&
        result.assets &&
        result.assets.length > 0
      ) {
        const file = result.assets[0];
        console.log("Selected file:", file.name);
        console.log("File URI:", file.uri);
        console.log("File type:", file.mimeType);
        console.log("File size:", file.size);

        // Ensure file has all required properties
        const completeFile = {
          ...file,
          // Ensure mimeType exists (fallback if not provided)
          mimeType:
            file.mimeType ||
            file.type ||
            (file.name.endsWith(".pdf")
              ? "application/pdf"
              : file.name.endsWith(".doc")
              ? "application/msword"
              : file.name.endsWith(".docx")
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/octet-stream"),
        };

        setResumeFile(completeFile);
        Alert.alert("Success", `File "${file.name}" selected successfully`);
      } else {
        console.log("Document picking canceled or failed");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const validateForm = () => {
    for (const field of form.fields) {
      if (field.required) {
        if (field.type === "file") {
          if (!resumeFile) {
            Alert.alert("Error", `Please upload your ${field.label}`);
            return false;
          }
        } else if (!responses[field.id]) {
          Alert.alert("Error", `Please fill in ${field.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log(
        "Starting form submission with file:",
        resumeFile ? resumeFile.name : "none"
      );

      // Format responses for API
      const formattedResponses = Object.keys(responses).map((fieldId) => {
        return {
          fieldId,
          value: String(responses[fieldId]),
        };
      });

      // Create form data for multipart/form-data submission
      const formData = new FormData();

      // Add responses as JSON string
      formData.append("responses", JSON.stringify(formattedResponses));

      // Add resume file if present - USING MODIFIED APPROACH
      if (resumeFile) {
        try {
          // Make sure we have all the required file information
          console.log("Attaching file to request:", resumeFile.name);

          // For web, when running in Chrome simulator
          if (Platform.OS === "web") {
            // In web, we need to get the actual file from the URI
            // For a fully working web version, you'd need file input element
            // This is a simplified version for testing
            console.log(
              "Web platform detected, handling file upload differently"
            );

            const response = await fetch(resumeFile.uri);
            const blob = await response.blob();
            formData.append("resume", blob, resumeFile.name);
          } else {
            // For React Native (iOS/Android)
            // Create the file object with explicit parameters
            const fileToUpload = {
              uri: resumeFile.uri,
              type: resumeFile.mimeType || "application/octet-stream",
              name: resumeFile.name || "resume.pdf",
            };
            console.log("File details:", JSON.stringify(fileToUpload));

            // Ensure we're using the correct format for React Native
            formData.append("resume", fileToUpload);
          }

          console.log("File appended to FormData");

          // Verify formData contents
          if (formData._parts) {
            for (let i = 0; i < formData._parts.length; i++) {
              console.log(
                `FormData part ${i}: key=${formData._parts[i][0]}, value=`,
                typeof formData._parts[i][1] === "object"
                  ? "File Object"
                  : formData._parts[i][1]
              );
            }
          }
        } catch (fileError) {
          console.error("Error preparing file:", fileError);
          console.error(fileError.stack);
        }
      }

      console.log("Sending form data to server...");

      try {
        // Send the request without manually setting Content-Type
        const response = await fetch(`${API_URL}/api/submit/${form._id}`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Submission response:", data);

        if (response.ok) {
          Alert.alert(
            "Success",
            "Your application has been submitted successfully!",
            [
              {
                text: "OK",
                onPress: () => {
                  // Reset form
                  const initialResponses = {};
                  form.fields.forEach((field) => {
                    if (field.type === "checkbox") {
                      initialResponses[field.id] = false;
                    } else {
                      initialResponses[field.id] = "";
                    }
                  });
                  setResponses(initialResponses);
                  setResumeFile(null);
                  setIsSubmitted(true);
                },
              },
            ]
          );
        } else {
          Alert.alert("Error", data.message || "Failed to submit form");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        Alert.alert("Error", "An unexpected error occurred");
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <TextInput
            style={styles.textInput}
            value={responses[field.id]}
            onChangeText={(text) => handleResponseChange(field.id, text)}
            placeholder={`Enter ${field.label}`}
            keyboardType={
              field.type === "email"
                ? "email-address"
                : field.type === "tel"
                ? "phone-pad"
                : field.type === "number"
                ? "numeric"
                : "default"
            }
          />
        );

      case "textarea":
        return (
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={responses[field.id]}
            onChangeText={(text) => handleResponseChange(field.id, text)}
            placeholder={`Enter ${field.label}`}
            multiline
            numberOfLines={4}
          />
        );

      case "select":
        return (
          <View style={styles.selectContainer}>
            {field.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectOption,
                  responses[field.id] === option
                    ? styles.selectOptionSelected
                    : null,
                ]}
                onPress={() => handleResponseChange(field.id, option)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    responses[field.id] === option
                      ? styles.selectOptionTextSelected
                      : null,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "radio":
        return (
          <View style={styles.radioContainer}>
            {field.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.radioOption}
                onPress={() => handleResponseChange(field.id, option)}
              >
                <View style={styles.radioButton}>
                  {responses[field.id] === option && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text style={styles.radioOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "checkbox":
        return (
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={responses[field.id]}
              onValueChange={(newValue) =>
                handleResponseChange(field.id, newValue)
              }
              tintColors={{ true: "#4a6da7", false: "#777" }}
            />
            <Text style={styles.checkboxLabel}>{field.label}</Text>
          </View>
        );

      case "date":
        return (
          <View>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => showDatepickerForField(field.id)}
            >
              <Text style={styles.datePickerButtonText}>
                {responses[field.id] || `Select ${field.label}`}
              </Text>
              <Ionicons name="calendar" size={20} color="#4a6da7" />
            </TouchableOpacity>

            {showDatePicker && dateField === field.id && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        );

      case "file":
        return (
          <View style={styles.fileContainer}>
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={pickResume}
            >
              <Ionicons name="document-attach" size={24} color="#4a6da7" />
              <Text style={styles.filePickerButtonText}>
                {resumeFile ? "Change File" : `Upload ${field.label}`}
              </Text>
            </TouchableOpacity>

            {resumeFile && (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <Ionicons name="document" size={24} color="#4a6da7" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {resumeFile.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {Math.round(resumeFile.size / 1024)} KB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.fileRemoveButton}
                  onPress={() => setResumeFile(null)}
                >
                  <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      default:
        return (
          <TextInput
            style={styles.textInput}
            value={responses[field.id]}
            onChangeText={(text) => handleResponseChange(field.id, text)}
            placeholder={`Enter ${field.label}`}
          />
        );
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  if (!form) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#e53e3e" />
        <Text style={styles.errorText}>Form not found or has expired</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Form Header */}
      <LinearGradient colors={["#4a6da7", "#6384b8"]} style={styles.formHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.formTitle}>{form.title}</Text>
            {form.description && (
              <Text style={styles.formDescription}>{form.description}</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4a6da7" />
              </View>
              <Text style={styles.successTitle}>
                Form Submitted Successfully!
              </Text>
              <Text style={styles.successMessage}>
                Thank you for your submission. Your responses have been
                recorded.
              </Text>
              <TouchableOpacity
                style={styles.submitAnotherButton}
                onPress={() => {
                  // Reset form and responses
                  setIsSubmitted(false);
                  initializeResponses();
                }}
              >
                <Text style={styles.submitAnotherButtonText}>
                  Submit Another Response
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Form Fields */}
              <View style={styles.formCard}>
                {form.fields.map((field, index) => (
                  <View key={index} style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {field.label}
                      {field.required && (
                        <Text style={styles.requiredStar}> *</Text>
                      )}
                    </Text>

                    {renderField(field)}
                  </View>
                ))}

                {/* Resume Upload Section */}
                {form.hrRequirements && form.hrRequirements.requireResume && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Resume Upload
                      {form.hrRequirements.resumeRequired && (
                        <Text style={styles.requiredStar}> *</Text>
                      )}
                    </Text>

                    <TouchableOpacity
                      style={styles.resumeUploadButton}
                      onPress={pickResume}
                    >
                      <FontAwesome5 name="file-pdf" size={20} color="#4a6da7" />
                      <Text style={styles.resumeUploadText}>
                        {resumeFile
                          ? resumeFile.name
                          : "Tap to upload your resume (PDF)"}
                      </Text>
                    </TouchableOpacity>

                    {resumeFile && (
                      <TouchableOpacity
                        style={styles.removeResumeButton}
                        onPress={() => setResumeFile(null)}
                      >
                        <Text style={styles.removeResumeText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Submit Form</Text>
                      <Ionicons
                        name="send"
                        size={18}
                        color="#ffffff"
                        style={{ marginLeft: 8 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Show date picker for iOS */}
          {showDatePicker && Platform.OS === "ios" && (
            <View style={styles.datePickerIOS}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(false);
                    if (date) {
                      handleDateChange(date);
                    }
                  }}
                >
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  setDate(selectedDate);
                }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  errorText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    color: "#2d3748",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#ffffff",
    fontSize: 14,
  },
  formHeader: {
    paddingTop: Platform.OS === "android" ? 20 : 0,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backIconButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  formTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: "#ffffff",
    marginBottom: 4,
  },
  formDescription: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#2d3748",
    marginBottom: 8,
  },
  requiredStar: {
    color: "#e53e3e",
  },
  textInput: {
    fontFamily: "Montserrat_400Regular",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2d3748",
  },
  textareaInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    padding: 12,
  },
  datePickerText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#9DA3B4",
  },
  datePickerSelectedText: {
    color: "#2d3748",
  },
  datePickerIOS: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e1e5eb",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5eb",
  },
  datePickerCancel: {
    fontFamily: "Montserrat_500Medium",
    color: "#4a5568",
    fontSize: 14,
  },
  datePickerDone: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#4a6da7",
    fontSize: 14,
  },
  selectContainer: {
    marginTop: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "rgba(74, 109, 167, 0.1)",
    borderColor: "#4a6da7",
  },
  selectedMultiOption: {
    backgroundColor: "rgba(74, 109, 167, 0.1)",
    borderColor: "#4a6da7",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4a6da7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4a6da7",
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#4a6da7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: (responses) => (responses ? "#4a6da7" : "transparent"),
  },
  optionText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#2d3748",
  },
  resumeUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    padding: 12,
  },
  resumeUploadText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#2d3748",
    marginLeft: 10,
    flex: 1,
  },
  removeResumeButton: {
    padding: 8,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  removeResumeText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: "#e53e3e",
  },
  submitButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#ffffff",
    fontSize: 16,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: "#2d3748",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#4a5568",
    textAlign: "center",
    marginBottom: 24,
  },
  submitAnotherButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  submitAnotherButtonText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#ffffff",
    fontSize: 14,
  },
  fileContainer: {
    marginTop: 20,
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 8,
    padding: 12,
  },
  filePickerButtonText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    color: "#2d3748",
    marginLeft: 10,
    flex: 1,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileDetails: {
    marginLeft: 10,
  },
  fileName: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#2d3748",
  },
  fileSize: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    color: "#9DA3B4",
  },
  fileRemoveButton: {
    padding: 8,
    alignSelf: "flex-end",
    marginTop: 8,
  },
});
