import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Text } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useAuthStore } from '../../stores/auth.store';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const { login, setAnonymous } = useAuthStore();
  const [_isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors: _errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    haptics.medium();

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      login({ id: '1', email: data.email, name: 'User' }, 'mock-token');

      haptics.success();
      router.replace('/(onboarding)/name');
    } catch {
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalMode = () => {
    haptics.light();
    setAnonymous(true);
    router.replace('/(onboarding)/name');
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
          <Text className="text-primary text-lg">← Back</Text>
        </Pressable>

        <Text variant="h1" className="mb-2 text-start">
          Welcome back
        </Text>

        <Text variant="muted" className="mb-8">
          Sign in to your account to continue
        </Text>

        <View className="flex flex-col gap-4">
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
                autoComplete="password"
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            size="lg"
            className="mt-6 w-full"
            // isLoading={isLoading}
          >
            <Text>Sign In</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
