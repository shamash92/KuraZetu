import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff} from "lucide-react-native";
import React, {useState} from "react";
import {router} from "expo-router";
import * as WebBrowser from "expo-web-browser";

import {useSafeAreaInsets} from "react-native-safe-area-context";

import {FieldLabel, FieldError, Input} from "@/components/auth/signupFields";
import {useSignup} from "@/app/_utils/auth/useSignup";
import SignupLoading from "@/components/auth/signup";
import {apiBaseURL} from "@/app/_utils/apiBaseURL";
import {perk} from "@/app/_utils/colors";

export default function SignupScreen() {
    const insets = useSafeAreaInsets();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const genders = ["Male", "Female"];
    const {
        formData,
        updateFormData,
        acceptedTerms,
        setAcceptedTerms,
        canSubmit,
        handleSignup,
        isLoading,
        error,
        fieldErrors,
        handleBallotAnimationComplete,
        hasRequiredDetails,
    } = useSignup();

    if (!hasRequiredDetails) return null;
    if (isLoading) {
        return (
            <SignupLoading
                onBallotAnimationComplete={handleBallotAnimationComplete}
            />
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.screen}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, {
                    paddingTop: insets.top + 12,
                    paddingBottom: insets.bottom + 28,
                }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft color={perk.ink} size={20} />
                </TouchableOpacity>
                <Text accessibilityRole="header" style={styles.title}>Final step</Text>
                {error ? <Text accessibilityRole="alert" style={styles.formError}>{error}</Text> : null}

                <View style={styles.form}>
                    <View style={styles.nameRow}>
                        <View style={styles.half}>
                            <FieldLabel label="First name" />
                            <Input
                                accessibilityLabel="First name"
                                autoComplete="given-name"
                                textContentType="givenName"
                                error={fieldErrors.firstName}
                                onChangeText={(value: string) => updateFormData("firstName", value)}
                                value={formData.firstName}
                            />
                        </View>
                        <View style={styles.half}>
                            <FieldLabel label="Last name" />
                            <Input
                                accessibilityLabel="Last name"
                                autoComplete="family-name"
                                textContentType="familyName"
                                error={fieldErrors.lastName}
                                onChangeText={(value: string) => updateFormData("lastName", value)}
                                value={formData.lastName}
                            />
                        </View>
                    </View>

                    <View style={styles.demographicRow}>
                        <View style={styles.gender}>
                            <FieldLabel label="Gender" />
                            <TouchableOpacity
                                accessibilityLabel="Gender"
                                accessibilityRole="button"
                                accessibilityState={{expanded: showGenderDropdown}}
                                activeOpacity={0.7}
                                onPress={() => setShowGenderDropdown((value) => !value)}
                                style={[styles.selectShell, fieldErrors.gender && styles.inputShellError]}
                            >
                                <Text style={[styles.selectText, formData.gender && styles.selectedText]}>
                                    {formData.gender || "Select"}
                                </Text>
                                <ChevronDown color={perk.ink} size={17} />
                            </TouchableOpacity>
                            {showGenderDropdown ? (
                                <View style={styles.dropdown}>
                                    {genders.map((gender) => (
                                        <TouchableOpacity
                                            key={gender}
                                            onPress={() => {
                                                updateFormData("gender", gender);
                                                setShowGenderDropdown(false);
                                            }}
                                            style={styles.dropdownOption}
                                        >
                                            <Text style={styles.dropdownText}>{gender}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : null}
                            {fieldErrors.gender ? <FieldError message={fieldErrors.gender} /> : null}
                        </View>
                        <View style={styles.age}>
                            <FieldLabel label="Age" />
                            <Input
                                accessibilityLabel="Age"
                                keyboardType="numeric"
                                error={fieldErrors.age}
                                onChangeText={(value: string) =>
                                    updateFormData("age", value.replace(/\D/g, "").slice(0, 2))
                                }
                                placeholder="18"
                                value={formData.age}
                            />
                        </View>
                    </View>

                    <View>
                        <FieldLabel label="Password" />
                        <Input
                            accessibilityLabel="Password"
                            autoComplete="new-password"
                            error={fieldErrors.password}
                            onChangeText={(value: string) => updateFormData("password", value)}
                            placeholder="At least 8 characters"
                            secureTextEntry={!showPassword}
                            textContentType="newPassword"
                            trailing={
                                <TouchableOpacity
                                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                    accessibilityRole="button"
                                    onPress={() => setShowPassword((value) => !value)}
                                    style={styles.visibilityButton}
                                >
                                    {showPassword ? (
                                        <EyeOff color={perk.mute} size={18} />
                                    ) : (
                                        <Eye color={perk.mute} size={18} />
                                    )}
                                </TouchableOpacity>
                            }
                            value={formData.password}
                        />
                    </View>
                    <View>
                        <FieldLabel label="Confirm password" />
                        <Input
                            accessibilityLabel="Confirm password"
                            autoComplete="new-password"
                            error={fieldErrors.confirmPassword}
                            onChangeText={(value: string) => updateFormData("confirmPassword", value)}
                            placeholder="Repeat your password"
                            secureTextEntry={!showConfirmPassword}
                            textContentType="newPassword"
                            trailing={
                                <TouchableOpacity
                                    accessibilityLabel={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                                    accessibilityRole="button"
                                    onPress={() => setShowConfirmPassword((value) => !value)}
                                    style={styles.visibilityButton}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff color={perk.mute} size={18} />
                                    ) : (
                                        <Eye color={perk.mute} size={18} />
                                    )}
                                </TouchableOpacity>
                            }
                            value={formData.confirmPassword}
                        />
                    </View>

                    <TouchableOpacity
                        accessibilityRole="checkbox"
                        accessibilityState={{checked: acceptedTerms}}
                        activeOpacity={0.7}
                        onPress={() => setAcceptedTerms((value) => !value)}
                        style={styles.termsRow}
                    >
                        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                            {acceptedTerms ? <Check color={perk.card} size={15} strokeWidth={3} /> : null}
                        </View>
                        <Text style={styles.termsText}>
                            I am 18 or older and accept the{" "}
                            <Text
                                accessibilityRole="link"
                                onPress={() => void WebBrowser.openBrowserAsync(`${apiBaseURL}/legal/terms/`)}
                                style={styles.termsLink}
                            >
                                Terms of use
                            </Text>{" "}
                            and{" "}
                            <Text
                                accessibilityRole="link"
                                onPress={() => void WebBrowser.openBrowserAsync(`${apiBaseURL}/legal/privacy/`)}
                                style={styles.termsLink}
                            >
                                Privacy policy
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{disabled: !canSubmit}}
                    activeOpacity={0.85}
                    disabled={!canSubmit}
                    onPress={() => void handleSignup()}
                    style={[styles.createButton, !canSubmit && styles.createButtonDisabled]}
                >
                    <Text style={styles.createText}>Create account</Text>
                    <ArrowRight color={perk.limeInk} size={20} strokeWidth={2} />
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {backgroundColor: perk.card, flex: 1},
    scrollContent: {paddingHorizontal: 24},
    backButton: {alignItems: "center", backgroundColor: perk.surface, borderRadius: 22, height: 44, justifyContent: "center", marginBottom: 24, width: 44},
    title: {color: perk.ink, fontFamily: "PublicSans-ExtraBold", fontSize: 30, letterSpacing: -0.7, lineHeight: 38},
    form: {gap: 20, marginTop: 28},
    formError: {backgroundColor: perk.coral, borderRadius: 10, color: perk.ink, fontSize: 13, fontWeight: "600", lineHeight: 18, marginTop: 18, paddingHorizontal: 14, paddingVertical: 11},
    nameRow: {gap: 20},
    half: {width: "100%"},
    inputShellError: {borderColor: perk.coralDeep},
    visibilityButton: {alignItems: "center", justifyContent: "center", minHeight: 50, width: 48},
    demographicRow: {flexDirection: "row", gap: 16},
    gender: {flex: 1.5, zIndex: 2},
    age: {flex: 1},
    selectShell: {alignItems: "center", borderColor: perk.rule16, borderRadius: 12, borderWidth: 1, flexDirection: "row", minHeight: 52, justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12},
    selectText: {color: perk.mute, fontSize: 16},
    selectedText: {color: perk.ink},
    dropdown: {backgroundColor: perk.card, borderColor: perk.rule16, borderRadius: 12, borderWidth: 1, elevation: 6, left: 0, paddingVertical: 4, position: "absolute", right: 0, shadowColor: perk.ink, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 12, top: 84},
    dropdownOption: {paddingHorizontal: 14, paddingVertical: 14},
    dropdownText: {color: perk.ink, fontSize: 16},
    createButton: {alignItems: "center", backgroundColor: perk.lime, borderRadius: 14, flexDirection: "row", gap: 12, minHeight: 54, justifyContent: "center", marginTop: 28, paddingHorizontal: 20, paddingVertical: 14},
    createButtonDisabled: {opacity: 0.4},
    createText: {color: perk.limeInk, fontSize: 16, fontWeight: "700"},
    termsRow: {alignItems: "flex-start", flexDirection: "row", gap: 12},
    checkbox: {alignItems: "center", borderColor: perk.rule16, borderRadius: 6, borderWidth: 1.5, height: 22, justifyContent: "center", marginTop: 1, width: 22},
    checkboxChecked: {backgroundColor: perk.ink, borderColor: perk.ink},
    termsText: {color: perk.inkSoft, flex: 1, fontSize: 14, lineHeight: 21},
    termsLink: {color: perk.ink, fontWeight: "600", textDecorationLine: "underline"},
});
