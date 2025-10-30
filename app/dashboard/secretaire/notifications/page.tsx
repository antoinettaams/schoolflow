"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Check, Trash2, Settings, Mail, MessageSquare, AlertTriangle, Info } from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  type: "info" | "warning" | "urgence" | "systeme";
  date: string;
  lue: boolean;
  emetteur: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      titre: "Nouvelle inscription en attente",
      message: "Marie Dupont a soumis une demande d&lsquo;inscription nécessitant votre validation.",
      type: "warning",
      date: "2024-01-15T10:30:00",
      lue: false,
      emetteur: "Système"
    },
    {
      id: "2",
      titre: "Paiement en retard",
      message: "Luc Martin a un paiement en retard de 15 jours. Montant: 450€",
      type: "urgence",
      date: "2024-01-15T09:15:00",
      lue: false,
      emetteur: "Système"
    },
    {
      id: "3",
      titre: "Mise à jour du système",
      message: "Une nouvelle version de l&lsquo;application est disponible.",
      type: "info",
      date: "2024-01-14T16:45:00",
      lue: true,
      emetteur: "Administration"
    },
  ]);

  const [parametres, setParametres] = useState({
    email: true,
    push: true,
    sms: false,
    rappels: true,
    newsletters: false
  });

  const getTypeIcon = (type: string) => {
    const icons = {
      info: Info,
      warning: AlertTriangle,
      urgence: Bell,
      systeme: Settings
    };
    const Icon = icons[type as keyof typeof icons];
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      info: "text-blue-600 bg-blue-50",
      warning: "text-orange-600 bg-orange-50",
      urgence: "text-red-600 bg-red-50",
      systeme: "text-gray-600 bg-gray-50"
    };
    return colors[type as keyof typeof colors];
  };

  const marquerCommeLue = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, lue: true } : notif
    ));
  };

  const marquerToutesCommeLues = () => {
    setNotifications(notifications.map(notif => ({ ...notif, lue: true })));
  };

  const supprimerNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const supprimerToutesLues = () => {
    setNotifications(notifications.filter(notif => !notif.lue));
  };

  const notificationsNonLues = notifications.filter(notif => !notif.lue).length;

  return (
    <div className="p-6 space-y-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos alertes et préférences de notification
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={marquerToutesCommeLues}>
            <Check className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
          <Button variant="outline" onClick={supprimerToutesLues}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer les lues
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Liste des notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Mes Notifications
              {notificationsNonLues > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notificationsNonLues} non lue(s)
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {notifications.length} notification(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Aucune notification
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Vous n&lsquo;avez aucune notification pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.lue ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${notification.lue ? 'text-gray-900' : 'text-blue-900'}`}>
                              {notification.titre}
                            </h4>
                            {!notification.lue && (
                              <Badge variant="default" className="bg-blue-600">Nouveau</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>De: {notification.emetteur}</span>
                            <span>•</span>
                            <span>
                              {new Date(notification.date).toLocaleDateString('fr-FR')} à{' '}
                              {new Date(notification.date).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.lue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => marquerCommeLue(notification.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => supprimerNotification(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paramètres des notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres
            </CardTitle>
            <CardDescription>
              Configurez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Notifications par Email
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications" className="text-sm">
                      Notifications importantes
                    </Label>
                    <Switch
                      id="email-notifications"
                      checked={parametres.email}
                      onCheckedChange={(checked) =>
                        setParametres({ ...parametres, email: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newsletters" className="text-sm">
                      Newsletters
                    </Label>
                    <Switch
                      id="newsletters"
                      checked={parametres.newsletters}
                      onCheckedChange={(checked) =>
                        setParametres({ ...parametres, newsletters: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications Push
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications" className="text-sm">
                      Alertes en temps réel
                    </Label>
                    <Switch
                      id="push-notifications"
                      checked={parametres.push}
                      onCheckedChange={(checked) =>
                        setParametres({ ...parametres, push: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Autres Préférences
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications" className="text-sm">
                      Notifications SMS
                    </Label>
                    <Switch
                      id="sms-notifications"
                      checked={parametres.sms}
                      onCheckedChange={(checked) =>
                        setParametres({ ...parametres, sms: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rappels" className="text-sm">
                      Rappels automatiques
                    </Label>
                    <Switch
                      id="rappels"
                      checked={parametres.rappels}
                      onCheckedChange={(checked) =>
                        setParametres({ ...parametres, rappels: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-principal hover:bg-principal/90">
                Sauvegarder les paramètres
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}