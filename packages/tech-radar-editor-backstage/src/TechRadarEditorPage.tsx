import { useCallback, useEffect, useRef, useState } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  microsoftAuthApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Content,
  Header,
  HeaderLabel,
  Page,
} from '@backstage/core-components';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';

import 'tech-radar-editor';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'tech-radar-editor': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'data-json'?: string;
          'hide-title'?: string;
          'hide-export'?: string;
          'hide-json-input'?: string;
          'hide-json-preview'?: string;
          'auto-expand-entries'?: string;
        },
        HTMLElement
      >;
    }
  }
}

const useStyles = makeStyles(theme => ({
  editorContainer: {
    '& tech-radar-editor': {
      display: 'block',
      width: '100%',
    },
  },
  stickyFooter: {
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2, 3),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[4],
    marginTop: theme.spacing(3),
  },
  successSnackbar: {
    backgroundColor: theme.palette.success?.main ?? '#4caf50',
  },
  errorSnackbar: {
    backgroundColor: theme.palette.error.main,
  },
}));

export const TechRadarEditorPage = () => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const microsoftAuth = useApi(microsoftAuthApiRef);
  const editorRef = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentJson, setCurrentJson] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch the current tech radar data from the backend (with Backstage auth)
  useEffect(() => {
    (async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('tech-radar-editor');
        const response = await fetchApi.fetch(`${baseUrl}/data`);
        if (response.ok) {
          const data = await response.json();
          setInitialJson(JSON.stringify(data, null, 2));
        } else {
          console.error('Failed to fetch tech radar data:', response.status);
        }
      } catch (error) {
        console.error('Error fetching tech radar data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [discoveryApi, fetchApi]);

  // Listen for radar-data-change events from the web component
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return undefined;

    const handleDataChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.data) {
        setCurrentJson(JSON.stringify(detail.data, null, 2));
      }
    };

    editor.addEventListener('radar-data-change', handleDataChange);
    return () => editor.removeEventListener('radar-data-change', handleDataChange);
  }, [loading]);

  const handleSave = useCallback(async () => {
    const jsonData = currentJson;
    if (!jsonData) {
      setResult({
        type: 'error',
        message:
          'Could not read valid JSON from the editor. Make sure you have loaded data first.',
      });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const userAzureToken = await microsoftAuth.getAccessToken(
        '499b84ac-1321-427f-aa17-267ca6975798/user_impersonation',
      );

      const baseUrl = await discoveryApi.getBaseUrl('tech-radar-editor');
      const response = await fetchApi.fetch(`${baseUrl}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: jsonData, userToken: userAzureToken }),
      });

      const body = await response.json();

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Pull request created successfully! View it here: ${body.pullRequestUrl}`,
        });
      } else {
        setResult({
          type: 'error',
          message: body.message || 'Failed to create pull request.',
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `Error creating pull request: ${error}`,
      });
    } finally {
      setSaving(false);
    }
  }, [discoveryApi, fetchApi, microsoftAuth, currentJson]);

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Tech Radar Editor" />
        <Content>
          <CircularProgress />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header title="Tech Radar Editor">
        <HeaderLabel label="Tool" value="Tech Radar" />
      </Header>
      <Content>
        <div className={classes.editorContainer}>
          <tech-radar-editor
            ref={(el: HTMLElement | null) => {
              editorRef.current = el;
            }}
            {...(initialJson ? { 'data-json': initialJson } : {})}
            hide-title="true"
            hide-export="true"
            hide-json-input={initialJson ? 'true' : undefined}
            hide-json-preview="true"
            auto-expand-entries="true"
          />
        </div>
        <div className={classes.stickyFooter}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : undefined}
          >
            {saving ? 'Creating PR...' : 'Submit as Pull Request'}
          </Button>
          <Typography variant="body2" color="textSecondary">
            This will create a pull request with your changes for review.
          </Typography>
        </div>
        <Snackbar
          open={result !== null}
          autoHideDuration={result?.type === 'error' ? undefined : 15000}
          onClose={() => setResult(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {result ? (
            <SnackbarContent
              className={
                result.type === 'success'
                  ? classes.successSnackbar
                  : classes.errorSnackbar
              }
              message={
                result.type === 'success' ? (
                  <span>
                    {result.message.split('View it here: ')[0]}
                    {result.message.includes('View it here: ') && (
                      <a
                        href={result.message.split('View it here: ')[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#fff', fontWeight: 'bold' }}
                      >
                        View the pull request
                      </a>
                    )}
                  </span>
                ) : (
                  result.message
                )
              }
              action={
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => setResult(null)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            />
          ) : undefined}
        </Snackbar>
      </Content>
    </Page>
  );
};
