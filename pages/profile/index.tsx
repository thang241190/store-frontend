import React, { useState } from 'react'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Auth } from 'aws-amplify'
import Link from 'next/link'
import Image from 'next/image'
interface IProfile {
  given_name: string
  family_name: string
  address: string
  zoneinfo: string
  phone_number: string
}

function Profile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IProfile>()

  async function updateUser(data: IProfile) {
    const user = await Auth.currentAuthenticatedUser()
    await Auth.updateUserAttributes(user, {
      given_name: data.given_name,
      family_name: data.family_name,
      address: data.address,
      zoneinfo: data.zoneinfo,
      phone_number: data.phone_number,
    })
  }

  const onSubmit: SubmitHandler<IProfile> = async (data: IProfile) => {
    updateUser(data)
  }

  return (
    <Authenticator variation='default' className='py-24'>
      {({ signOut, user }: any) => (
        <main>
          <h1>Hello {user.attributes.email}</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <p>
              <label htmlFor='given_name'>First name</label>
              <input
                id='given_name'
                defaultValue={user.attributes.given_name}
                {...register('given_name', { required: true })}
              />
            </p>
            <p>
              <label htmlFor='family_name'>Last name</label>
              <input
                id='family_name'
                defaultValue={user.attributes.family_name}
                {...register('family_name', { required: true })}
              />
            </p>
            <p>
              <label htmlFor='address'>Street</label>
              <input
                id='address'
                defaultValue={user.attributes.address}
                {...register('address', { required: true })}
              />
            </p>
            <p>
              <label htmlFor='zoneinfo'>Postal code</label>
              <input
                id='zoneinfo'
                defaultValue={user.attributes.zoneinfo}
                {...register('zoneinfo', { required: true })}
              />
            </p>
            <p>
              <label htmlFor='phone_number'>Phone</label>
              <input
                id='phone_number'
                defaultValue={user.attributes.phone_number}
                {...register('phone_number', { required: true })}
              />
            </p>
            <button type='submit'>Submit</button>
          </form>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  )
}
export default Profile
