import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Text } from '../../components/ui';
import { Icon } from '../../components/ui/icon';
import { ArrowLeft } from 'lucide-react-native';
import { haptics } from '../../lib/haptics';
import { useAuthStore } from '../../stores/auth.store';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Signup() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [_isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors: _errors },
  } = useForm<SignupForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    haptics.medium();

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      login({ id: '1', email: data.email, name: data.name }, 'mock-token');

      haptics.success();
      router.replace('/(dashboard)');
    } catch {
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-background flex-1">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-12">
        <Pressable
          onPress={() => {
            haptics.light();
            router.back();
          }}
          className="mb-8">
          <Icon as={ArrowLeft} size={32} className="text-foreground" />
        </Pressable>

        <Text variant="h1" className="mb-2 text-start">
          Create account
        </Text>

        <Text variant="muted" className="mb-8">
          Join Nuts to sync your finances across devices
        </Text>

        <View className="gap-4">
          <Controller
            control={control}
            name="name"
            rules={{
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                // label="Name"
                placeholder="Your name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                // error={errors.name?.message}
                autoComplete="name"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                // label="Email"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                // error={errors.email?.message}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                // label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                // error={errors.password?.message}
                secureTextEntry
                autoComplete="password-new"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                // label="Confirm Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                // error={errors.confirmPassword?.message}
                secureTextEntry
                autoComplete="password-new"
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            size="lg"
            className="mt-6 w-full"
            // isLoading={isLoading}
          >
            <Text>Create Account</Text>
          </Button>

          <View className="mt-4 flex-row items-center justify-center gap-1">
            <Text variant="muted">Already have an account?</Text>
            <Pressable
              onPress={() => {
                haptics.light();
                router.push('/(auth)/login');
              }}>
              <Text className="text-primary font-semibold">Sign in</Text>
            </Pressable>
          </View>

          <Text variant="muted" className="mt-4 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
