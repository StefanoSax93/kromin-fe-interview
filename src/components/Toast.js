import React from 'react'
import { AlertIcon } from '../theme/icons'

const Toast = ({ color, children, closeModal }) => {
    return (
        <>
            <div
                style={{
                    color: 'white',
                    backgroundColor: `${color}`,
                    borderRadius: '15px',
                    padding: '15px',
                    minWidth: '300px',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '3px',
                        right: '5px',
                        cursor: 'pointer',
                    }}
                    onClick={closeModal}
                >
                    <AlertIcon />
                </div>
                <span>{children}</span>
            </div>
        </>
    )
}

export default Toast
