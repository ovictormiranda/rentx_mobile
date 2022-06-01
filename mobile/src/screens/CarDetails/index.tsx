import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';

import { CarDTO } from '../../dtos/CarDTO';
import { api } from '../../services/api';

import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

import { Accessory } from '../../components/Accessory';
import { ImageSlider } from '../../components/ImageSlider';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';

import { getAccessoryIcon } from '../../utils/getAccessoryIcon';

import {
  Container,
  Header,
  CarImages,
  Details,
  Description,
  Brand,
  Name,
  Rent,
  Period,
  Price,
  About,
  Accessories,
  Footer,
  OfflineInfo,
} from './styles';

interface Params {
  carId: string;
}

export function CarDetails(){
  const [car, setCar] = useState<CarDTO>({} as CarDTO);

  const netInfo = useNetInfo();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { carId } = route.params as Params;

  const theme = useTheme();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyleAnimation = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [0, 200],
        [200, 70],
        Extrapolate.CLAMP
      )
    }
  });

  const sliderCarsStyleAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 150],
        [1, 0],
        Extrapolate.CLAMP
      )
    }
  });

  function handleConfirmRental() {
    navigation.navigate('Scheduling', { car })
  }

  function handleBack() {
    navigation.goBack();
  }

  useEffect(() => {
    async function fetchOnlineData() {
      const response = await api.get(`cars/${carId}`);
      setCar(response.data);
    }

    if (netInfo.isConnected === true) {
      fetchOnlineData();
    }
  },[netInfo.isConnected]);

  return (
    <Container>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <Animated.View
        style={[
          headerStyleAnimation,
          styles.header,
          { backgroundColor: theme.colors.background_secondary}
        ]}
      >
        <Header>
          <BackButton onPress={handleBack} />
        </Header>

        <Animated.View style={[sliderCarsStyleAnimation]}>
          <CarImages>
            <ImageSlider
              imagesUrl={
                !!car.photos ?
                car.photos : [{ id: car.thumbnail, photo: car.thumbnail }]
              }
            />
          </CarImages>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: getStatusBarHeight() + 160,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Details>
          <Description>
            <Brand>{car.brand}</Brand>
            <Name>{car.name}</Name>
          </Description>

          <Rent>
            <Period>{car.period}</Period>
            <Price>R$ {netInfo.isConnected === true ? car.price : '...'}</Price>
          </Rent>
        </Details>
        {
          car.accessories &&
          <Accessories>
            {
              car.accessories.map(accessory => (
                <Accessory
                  key={accessory.id}
                  name={accessory.name}
                  icon={getAccessoryIcon(accessory.type)}
                />
              ))
            }
          </Accessories>
        }
        <About>{car.about}</About>
      </Animated.ScrollView>

      <Footer>
        <Button
          title="Escolher período de aluguel"
          onPress={handleConfirmRental}
          enabled={netInfo.isConnected === true}
        />
        {
          netInfo.isConnected === false &&
          <OfflineInfo>
            Conecte-se a internet para ver mais detalhes e agendar seu carro.
          </OfflineInfo>
        }
      </Footer>

    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  },
})
