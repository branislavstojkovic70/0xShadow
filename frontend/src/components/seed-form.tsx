import {
    Box,
    Button,
    Container,
    Step,
    StepLabel,
    Stepper,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    Paper,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { Wallet } from "ethers";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";

const steps = [
    "Backup Your Seed Phrase",
    "Confirm Selected Words",
    "Set Password",
];

export default function SeedForm() {
    const [activeStep, setActiveStep] = useState(0);
    const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
    const [confirmWords, setConfirmWords] = useState<{ [key: number]: string }>({});
    const [visibleInputs, setVisibleInputs] = useState<{ [key: number]: boolean }>({});
    const navigate = useNavigate();

    const indexesToConfirm = [1, 5, 9];

    useEffect(() => {
        if (activeStep === 0 && mnemonicWords.length === 0) {
            const wallet = Wallet.createRandom();
            const phrase = wallet.mnemonic?.phrase || "";
            setMnemonicWords(phrase.split(" "));
        }
    }, [activeStep]);

    const handleToggleVisibility = (index: number) => {
        setVisibleInputs((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleConfirmChange = (index: number, value: string) => {
        setConfirmWords((prev) => ({ ...prev, [index]: value }));
    };

    const handleSeedContinue = () => {
        setActiveStep(1);
    };

    const handleFinalConfirm = () => {
        const allCorrect = indexesToConfirm.every(
            (i) => mnemonicWords[i] === confirmWords[i]?.trim().toLowerCase()
        );

        if (!allCorrect) {
            toast.error("Incorrect words. Please try again.");
            return;
        }

        setActiveStep(2);
    };

    const credentialsForm = useFormik({
        initialValues: { password: "", confirm: "" },
        validationSchema: yup.object({
            password: yup
                .string()
                .required("Password is required")
                .min(8, "Password must be at least 8 characters"),
            confirm: yup
                .string()
                .oneOf([yup.ref("password")], "Passwords must match")
                .required("Please confirm your password"),
        }),
        onSubmit: async (values) => {
            navigate("/");
        },
    });

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && (
                <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Your Secret Recovery Phrase
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please write down the 12 words below in the correct order and store them safely.
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mt: 2 }}>
                        {mnemonicWords.map((word, i) => (
                            <Box
                                key={i}
                                sx={{ px: 2, py: 1, borderRadius: 3, backgroundColor: "background.default", border: "1px solid", borderColor: "divider", fontWeight: 500 }}
                            >
                                {i + 1}. {word}
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Button fullWidth variant="contained" onClick={handleSeedContinue}>
                            Continue
                        </Button>
                    </Box>
                </Paper>
            )}

            {activeStep === 1 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Confirm Your Seed Phrase
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Please fill in the missing words from your seed phrase to continue.
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mt: 2 }}>
                        {mnemonicWords.map((word, i) => {
                            const isEditable = indexesToConfirm.includes(i);
                            const isVisible = visibleInputs[i] || false;
                            return (
                                <TextField
                                    key={i}
                                    label={`Word #${i + 1}`}
                                    type={isVisible ? "text" : "password"}
                                    value={isEditable ? confirmWords[i] || "" : word}
                                    onChange={(e) => handleConfirmChange(i, e.target.value)}
                                    InputProps={{
                                        readOnly: !isEditable,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => handleToggleVisibility(i)} edge="end">
                                                    {isVisible ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            );
                        })}
                    </Box>
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Button variant="contained" fullWidth onClick={handleFinalConfirm}>
                            Continue
                        </Button>
                    </Box>
                </Paper>
            )}

            {activeStep === 2 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Create Your Credentials
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Set a password to protect your wallet.
                    </Typography>
                    <form onSubmit={credentialsForm.handleSubmit}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                {...credentialsForm.getFieldProps("password")}
                                error={credentialsForm.touched.password && Boolean(credentialsForm.errors.password)}
                                helperText={credentialsForm.touched.password && credentialsForm.errors.password}
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                fullWidth
                                {...credentialsForm.getFieldProps("confirm")}
                                error={credentialsForm.touched.confirm && Boolean(credentialsForm.errors.confirm)}
                                helperText={credentialsForm.touched.confirm && credentialsForm.errors.confirm}
                            />
                            <Button type="submit" variant="contained">
                                Finish
                            </Button>
                        </Box>
                    </form>
                </Paper>
            )}
        </Container>
    );
}