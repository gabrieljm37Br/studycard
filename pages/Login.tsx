import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

type LoginMode = 'login' | 'signup' | 'forgot' | 'update_password';

const Login: React.FC = () => {
    const [mode, setMode] = useState<LoginMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, signUp, resetPassword, updatePassword } = useAuth();
    const navigate = useNavigate();

    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    useEffect(() => {
        // Detect if we came from a password recovery email
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === "PASSWORD_RECOVERY") {
                setMode('update_password');
            }
        });

        // Also check URL for access_token or type=recovery (standard Supabase redirect behavior)
        if (window.location.hash.includes('type=recovery')) {
            setMode('update_password');
        }

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                await signUp(email, password, fullName);
                setMessage('Conta criada! Verifique seu email para confirmar.');
            } else if (mode === 'login') {
                await signIn(email, password);
                navigate('/home');
            } else if (mode === 'forgot') {
                if (cooldown > 0) return;
                await resetPassword(email);
                setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
                setCooldown(60); // 60 seconds cooldown
            } else if (mode === 'update_password') {
                if (password !== confirmPassword) {
                    throw new Error('As senhas não coincidem.');
                }
                await updatePassword(password);
                setMessage('Senha atualizada com sucesso! Você já pode entrar.');
                setMode('login');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            if (err.status === 429 || err.message?.includes('rate limit')) {
                setError('Muitas tentativas em pouco tempo. Por favor, aguarde 1 minuto para tentar novamente.');
                if (mode === 'forgot') setCooldown(60);
            } else {
                setError(err.message || 'Ocorreu um erro. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'signup': return 'Crie sua conta';
            case 'forgot': return 'Recuperar Senha';
            case 'update_password': return 'Nova Senha';
            default: return 'Entre na sua conta';
        }
    };

    const getButtonText = () => {
        if (loading) return 'Carregando...';
        switch (mode) {
            case 'signup': return 'Criar Conta';
            case 'forgot': return cooldown > 0 ? `Aguarde ${cooldown}s` : 'Enviar Link';
            case 'update_password': return 'Atualizar Senha';
            default: return 'Entrar';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <img src="/logo_studycard_sf.svg" alt="StudyCard" style={{ height: '56px', width: '56px' }} />
                </div>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    StudyCard
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: '#666',
                    marginBottom: '32px'
                }}>
                    {getTitle()}
                </p>

                <form onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'signup' || mode === 'update_password') && (
                        <div style={{ marginBottom: (mode === 'update_password') ? '20px' : '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                {mode === 'update_password' ? 'Nova Senha' : 'Senha'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ ...inputStyle, paddingRight: '45px' }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={eyeButtonStyle}
                                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'update_password' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                Confirmar Nova Senha
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                        </div>
                    )}

                    {error && <div style={errorStyle}>{error}</div>}
                    {message && <div style={messageStyle}>{message}</div>}

                    <button
                        type="submit"
                        disabled={loading || (mode === 'forgot' && cooldown > 0)}
                        style={{
                            ...buttonStyle,
                            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {getButtonText()}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        {mode === 'login' && (
                            <>
                                <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} style={linkButtonStyle}>
                                    Esqueci minha senha
                                </button>
                                <div style={{ height: '8px' }} />
                                <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage(''); }} style={linkButtonStyle}>
                                    Não tem conta? Cadastre-se
                                </button>
                            </>
                        )}
                        {mode === 'signup' && (
                            <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={linkButtonStyle}>
                                Já tem uma conta? Entre
                            </button>
                        )}
                        {(mode === 'forgot' || mode === 'update_password') && (
                            <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={linkButtonStyle}>
                                Voltar para o Login
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s',
    outline: 'none',
};

const eyeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666'
};

const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginBottom: '16px'
};

const linkButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#667eea',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline'
};

const errorStyle: React.CSSProperties = {
    padding: '12px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    marginBottom: '20px',
    fontSize: '14px'
};

const messageStyle: React.CSSProperties = {
    padding: '12px',
    background: '#effaf3',
    border: '1px solid #d1e7dd',
    borderRadius: '8px',
    color: '#0f5132',
    marginBottom: '20px',
    fontSize: '14px'
};

export default Login;
