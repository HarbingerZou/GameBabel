import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import type { GetServerSideProps } from "next";
import axios from "axios";

interface Topic {
  _id: string;
  name: string;
  createdAt: string;
}

interface TopicsPageProps {
  initialTopics: Topic[];
}

export default function Topics({ initialTopics }: TopicsPageProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [newTopic, setNewTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTopic }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create topic");
      }

      const newTopicData = await response.json();
      setTopics([...topics, newTopicData]);
      setNewTopic("");
      setSuccess("Topic created successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating topic");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      const response = await fetch(`/api/topic/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete topic");

      setTopics(topics.filter((topic) => topic._id !== id));
      setSuccess("Topic deleted successfully");
    } catch (err) {
      setError("Error deleting topic");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Topic Management
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleCreateTopic}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="New Topic"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ minWidth: "120px" }}
            >
              Add
            </Button>
          </Box>
        </form>
      </Paper>

      <Paper>
        <List>
          {topics.map((topic) => (
            <ListItem key={topic._id} divider>
              <ListItemText
                primary={topic.name}
                secondary={new Date(topic.createdAt).toLocaleDateString()}
              />
              <ListItemSecondaryAction>
                <Button
                  color="error"
                  onClick={() => handleDeleteTopic(topic._id)}
                >
                  Delete
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const DATA_PERSISTENCE_URL =
      process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";
    const response = await axios.get(`${DATA_PERSISTENCE_URL}/api/topic`);

    return {
      props: {
        initialTopics: response.data,
      },
    };
  } catch (error) {
    console.error("Error fetching topics:", error);
    return {
      props: {
        initialTopics: [],
      },
    };
  }
};
