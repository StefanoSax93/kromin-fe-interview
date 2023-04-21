import { createUseStyles } from 'react-jss'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { DEFAULT_LOGIN_MOCK, LOGIN_MODEL, validationSchema } from './loginModel'
import Input from '../../components/Input'
import { useState, useEffect } from 'react'
import { EyeOffIcon, EyeOnIcon, SuccessIcon } from '../../theme/icons'
import Button from '../../components/Button'
import { Link } from 'react-router-dom'
import { ROUTE_SIGNUP } from '../../utilities/constants'
import AuthAPI from '../../http/auth.http'
import { handleApiError } from '../../utilities/helpers'
import useError from '../../hooks/useError'
import Logo from '../../components/Logo'
import useUser from '../../hooks/useUser'
import Toast from '../../components/Toast'
import { gsap } from 'gsap'
import { FaRegSadCry } from 'react-icons/fa'

const useStyles = createUseStyles(theme => ({
    formTitle: {
        textAlign: 'left',
        [theme.mediaQueries.lUp]: {
            textAlign: 'center',
        },
    },
    formFooter: {
        textAlign: 'center',
        '& > * ': {
            marginBottom: 24,
        },
    },
    formWrapper: {
        height: '100%',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        flexGrow: 1,
        justifyContent: 'space-between',
        maxWidth: 348,
        [theme.mediaQueries.lUp]: {
            minWidth: 348,
            justifyContent: 'center',
            height: 'auto',
        },
    },
    fieldWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    errorMessage: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
}))

const Login = () => {
    const showError = useError()
    const { createUser } = useUser()
    const [showPassword, setShowPassword] = useState(false)
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [errorArray, setErrorArray] = useState([])

    const methods = useForm({
        shouldUnregister: false,
        mode: 'onBlur',
        reValidateMode: 'onChange',
        nativeValidation: false,
        shouldFocusError: true,
        resolver: yupResolver(validationSchema),
        defaultValues: DEFAULT_LOGIN_MOCK,
    })
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, touchedFields },
    } = methods

    const submitHandler = async values => {
        try {
            const { data } = await AuthAPI.loginUser(values)
            createUser(data)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
                handleFormError: setError,
            })

            gsap.fromTo(
                `.${classes.errorMessage}`,
                { opacity: 0, x: 100 },
                { opacity: 1, x: 0, duration: 0.5 }
            )

            setErrorArray([...errorArray, 'User not registered'])
        }
    }

    useEffect(() => {
        gsap.to(`.${classes.errorMessage}`, {
            opacity: 0,
            x: 100,
            delay: 3,
            duration: 0.5,
        })
        const intervalId = setInterval(() => {
            if (errorArray.length > 0) {
                setErrorArray(prevMessages => prevMessages.slice(1))
            } else {
                setErrorArray([])
            }
        }, 3000)

        return () => clearInterval(intervalId)
    }, [errorArray])

    const classes = useStyles()

    return (
        <>
            <FormProvider {...methods}>
                <form
                    onSubmit={handleSubmit(submitHandler)}
                    className={classes.formWrapper}
                >
                    <div className={classes.fieldWrapper}>
                        <div className={classes.formTitle}>
                            <Logo />
                        </div>
                        <Input
                            type={'text'}
                            label={'email'}
                            placeholder={'your email'}
                            touched={touchedFields[LOGIN_MODEL.email]}
                            errors={errors[LOGIN_MODEL.email]}
                            {...register(LOGIN_MODEL.email)}
                        />
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label={'password'}
                            placeholder={'your password'}
                            touched={touchedFields[LOGIN_MODEL.password]}
                            errors={errors[LOGIN_MODEL.password]}
                            {...register(LOGIN_MODEL.password)}
                            statusIcon={
                                showPassword ? <EyeOnIcon /> : <EyeOffIcon />
                            }
                            statusIconCallback={() =>
                                setShowPassword(!showPassword)
                            }
                        />
                    </div>
                    <div className={classes.formFooter}>
                        <Button
                            icon={<SuccessIcon />}
                            iconPosition={'left'}
                            disabled={isSubmitting}
                            width={'100%'}
                            type={'submit'}
                            variant={'filled'}
                        >
                            login
                        </Button>
                        new to todos ?{' '}
                        <Link to={ROUTE_SIGNUP}>create an account</Link>
                    </div>
                </form>
            </FormProvider>
            {errorArray.length > 0 &&
                errorArray.map((_, index) => (
                    <div
                        className={classes.errorMessage}
                        style={{ zIndex: 100 - index }}
                    >
                        <Toast
                            key={index}
                            color="#D65459"
                            closeModal={() =>
                                setErrorArray(errorArray.slice(1))
                            }
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <FaRegSadCry />{' '}
                                <span>Wrong email or password</span>
                            </div>
                        </Toast>
                    </div>
                ))}
        </>
    )
}

export default Login
