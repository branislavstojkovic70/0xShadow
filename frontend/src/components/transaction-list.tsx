import {
    Box,
    Card,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip,
    Typography,
    TextField,
    InputAdornment,
    Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
    getStealthAddressesWithBalance,
    getMasterWalletBalance,
    fetchTransactionsForAddress,
} from "../service/eth";
import { generateKeyPairs } from "../util/crypto";
import { usePassword } from "../context/password-context";

interface TxInfo {
    hash: string;
    to: string;
    value: string;
    timestamp: string;
}

const ethFormatter = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
});

export default function TransactionList() {
    const [addresses, setAddresses] = useState<
        { label: string; address: string; balance: number }[]
    >([]);
    const [selectedAddress, setSelectedAddress] = useState<string>("");
    const [transactions, setTransactions] = useState<TxInfo[]>([]);
    const [loadingAddrs, setLoadingAddrs] = useState(true);
    const [loadingTxs, setLoadingTxs] = useState(false);
    const [selectedBalance, setSelectedBalance] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const {password} = usePassword();
    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied!");
        } catch {
            toast.error("Copy failed.");
        }
    };

    useEffect(() => {
        (async () => {
            setLoadingAddrs(true);
            try {


                const keys = await generateKeyPairs(password!);
                const stealths = await getStealthAddressesWithBalance(password!);
                const masterBalanceResult = await getMasterWalletBalance(
                    password!
                );
                const masterBalance = parseFloat(masterBalanceResult.balance);

                const all = [
                    {
                        address: keys.master.address,
                        label: `Master - ${keys.master.address}`,
                        isStealth: false,
                        balance: masterBalance,
                    },
                    ...stealths.map((s) => ({
                        address: s.stealthAddress,
                        label: `Stealth - ${s.stealthAddress}`,
                        isStealth: true,
                        balance: parseFloat(s.balance),
                        ephemeralPubKey: s.ephermalPubKey,
                    })),
                ];

                const provider = new ethers.JsonRpcProvider(
                    "http://127.0.0.1:8545"
                );
                const filtered = await Promise.all(
                    all.map(async (addr) => {
                        const latestBlock = await provider.getBlockNumber();

                        for (
                            let i = latestBlock;
                            i >= Math.max(0, latestBlock - 1000);
                            i--
                        ) {
                            const block = await provider.getBlock(i, true);
                            if (!block || !block.prefetchedTransactions)
                                continue;

                            if (
                                block.prefetchedTransactions.some(
                                    (tx) =>
                                        tx.from.toLowerCase() ===
                                        addr.address.toLowerCase() &&
                                        tx.value > 0n
                                )
                            ) {
                                return addr;
                            }
                        }

                        return null;
                    })
                );

                const activeAddresses = filtered.filter(
                    (a): a is (typeof all)[number] => !!a
                );
                setAddresses(activeAddresses);

                if (activeAddresses.length) {
                    setSelectedAddress(activeAddresses[0].address);
                    setSelectedBalance(activeAddresses[0].balance);
                }
            } catch (err) {
                toast.error("Failed to load addresses.");
            } finally {
                setLoadingAddrs(false);
            }
        })();
    }, []);

    const handleSenderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newAddress = event.target.value;
        setSelectedAddress(newAddress);
        const selected = addresses.find((s) => s.address === newAddress);
        setSelectedBalance(selected ? selected.balance : null);
        setCurrentPage(1);
    };

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!selectedAddress) return;

            setLoadingTxs(true);
            try {
                const parsed = await fetchTransactionsForAddress(selectedAddress);
                setTransactions(parsed);
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch transactions.");
            } finally {
                setLoadingTxs(false);
            }
        };

        fetchTransactions();
    }, [selectedAddress]);

    const filteredTransactions = transactions.filter((tx) =>
        tx.to.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTxs = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    return (
        <Box
            sx={{
                pt: 1,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Typography variant="h4" fontWeight={600} gutterBottom>
                Transactions
            </Typography>

            <Divider sx={{ mb: 3, width: "100%", maxWidth: 600 }} />

            <Box sx={{ width: "100%", maxWidth: 600, mb: 3 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField
                        label="Addresses"
                        fullWidth
                        select
                        placeholder="Select address"
                        value={selectedAddress}
                        onChange={handleSenderChange}
                        SelectProps={{ native: true }}
                        disabled={addresses.length === 0 || loadingAddrs}
                        InputProps={{
                            startAdornment: loadingAddrs && (
                                <InputAdornment position="start" sx={{ gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2">Loading...</Typography>
                                </InputAdornment>
                            ),
                        }}
                    >
                        {addresses.map((opt) => (
                            <option key={opt.address} value={opt.address}>
                                {opt.label}
                            </option>
                        ))}
                    </TextField>

                    <TextField
                        label="Balance"
                        value={
                            selectedBalance !== null
                                ? `${ethFormatter.format(selectedBalance)} ETH`
                                : "-"
                        }
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        sx={{ width: "180px" }}
                        disabled
                    />
                </Box>
            </Box>

            <TextField
                label="Search by recipient"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
                sx={{ width: "100%", maxWidth: 600, mb: 2 }}
            />

            <Divider sx={{ mb: 3, width: "100%", maxWidth: 600 }} />

            {loadingTxs ? (
                <CircularProgress />
            ) : filteredTransactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No transactions found for this address.
                </Typography>
            ) : (
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 600,
                        flexGrow: 1,
                        overflowY: "auto",
                        minHeight: 0,
                        pb: 10,
                    }}
                >
                    {paginatedTxs.map((tx) => (
                        <Card
                            key={tx.hash}
                            variant="outlined"
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                p: 2,
                                mb: 2,
                                gap: 1,
                                boxShadow: 1,
                                borderRadius: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                >
                                    Tx Hash:
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: "280px",
                                        }}
                                    >
                                        {tx.hash}
                                    </Typography>
                                    <Tooltip title="Copy hash">
                                        <IconButton
                                            onClick={() => handleCopy(tx.hash)}
                                            size="small"
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                >
                                    To:
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        maxWidth: "280px",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {tx.to}
                                    </Typography>
                                    <Tooltip title="Copy address">
                                        <IconButton
                                            onClick={() => handleCopy(tx.to)}
                                            size="small"
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                >
                                    Value:
                                </Typography>
                                <Typography variant="body2">
                                    {tx.value} ETH
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                >
                                    Timestamp:
                                </Typography>
                                <Typography variant="body2">
                                    {tx.timestamp}
                                </Typography>
                            </Box>
                        </Card>
                    ))}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mt: 2,
                        }}
                    >
                        <Button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            Page {currentPage} of {totalPages}
                        </Typography>
                        <Button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
