import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { userApi } from "../../../api/user.api";
import PageLoader from "../../../components/common/PageLoader";

interface ProfileFormInput {
  fullName: string;
  phone: string;
  bio: string;
  country: string;
  timezone: string;
}

interface PasswordFormInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormInput>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormInput>();

  // Reset form when profile data loads
  useEffect(() => {
    if (profile) {
      resetProfile({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        bio: profile.profile?.bio || "",
        country: profile.profile?.country || "",
        timezone: profile.profile?.timezone || "",
      });
    }
  }, [profile, resetProfile]);

  if (isLoading) {
    return <PageLoader />;
  }

  const onUpdateProfile = async (data: ProfileFormInput) => {
    setProfileSuccess("");
    setProfileError("");
    try {
      await userApi.updateProfile(data);
      setProfileSuccess("Profile updated successfully!");
      refetch();
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || "Failed to update profile.");
    }
  };

  const onChangePassword = async (data: PasswordFormInput) => {
    setPasswordSuccess("");
    setPasswordError("");
    try {
      await userApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      resetPassword();
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || "Failed to change password.");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarLoading(true);
    setProfileError("");
    try {
      await userApi.updateAvatar(formData);
      setProfileSuccess("Avatar updated successfully!");
      refetch();
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || "Failed to upload avatar.");
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Avatar and Card */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center h-fit">
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full bg-[#f0f7f4] border-2 border-gray-100 flex items-center justify-center text-3xl font-bold text-[#1a3a2a] overflow-hidden shrink-0">
              {avatarLoading ? (
                <div className="w-8 h-8 rounded-full border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] animate-spin" />
              ) : profile?.profile?.avatar ? (
                <img src={profile.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white flex items-center justify-center cursor-pointer shadow-md transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarLoading} />
            </label>
          </div>

          <h2 className="text-lg font-bold text-gray-800">{profile?.fullName || profile?.username}</h2>
          <p className="text-xs text-[#2d6a4f] font-semibold bg-[#f0f7f4] px-2.5 py-1 rounded-full mt-1.5 capitalize">Admin / {profile?.profile?.type || "Executor"}</p>
          <p className="text-xs text-gray-400 mt-2 truncate w-full">{profile?.email}</p>

          <div className="w-full border-t border-gray-100 my-4 pt-4 text-left space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Username</span>
              <span className="font-medium text-gray-700">{profile?.username}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Role</span>
              <span className="font-semibold text-[#2d6a4f]">Administrator</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Joined</span>
              <span className="font-medium text-gray-700">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Forms */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex border-b border-gray-100 mb-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all ${
                activeTab === "info"
                  ? "border-[#2d6a4f] text-[#1a3a2a]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Account Information
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 ml-6 transition-all ${
                activeTab === "security"
                  ? "border-[#2d6a4f] text-[#1a3a2a]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Security Settings
            </button>
          </div>

          {activeTab === "info" ? (
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-5">
              {profileSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                  <input
                    {...registerProfile("fullName", { required: "Full name is required" })}
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {profileErrors.fullName && <p className="text-xs text-red-500 mt-1">{profileErrors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                  <input
                    {...registerProfile("phone", { minLength: { value: 7, message: "At least 7 digits" } })}
                    type="tel"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                    placeholder="+1 234 567 890"
                  />
                  {profileErrors.phone && <p className="text-xs text-red-500 mt-1">{profileErrors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Country</label>
                  <input
                    {...registerProfile("country")}
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                    placeholder="United States"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Timezone</label>
                  <input
                    {...registerProfile("timezone")}
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                    placeholder="UTC-5 or EST"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bio</label>
                <textarea
                  {...registerProfile("bio", { maxLength: { value: 300, message: "Maximum 300 characters" } })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
                {profileErrors.bio && <p className="text-xs text-red-500 mt-1">{profileErrors.bio.message}</p>}
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white hover:bg-[#2d6a4f] text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {profileSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-5">
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
                <input
                  {...registerPassword("currentPassword", { required: "Current password is required" })}
                  type="password"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  placeholder="Enter current password"
                />
                {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                <input
                  {...registerPassword("newPassword", {
                    required: "New password is required",
                    minLength: { value: 8, message: "Must be at least 8 characters" },
                  })}
                  type="password"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  placeholder="Create new password"
                />
                {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                <input
                  {...registerPassword("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (val) => val === watchPassword("newPassword") || "Passwords do not match",
                  })}
                  type="password"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  placeholder="Re-enter new password"
                />
                {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1a3a2a] text-white hover:bg-[#2d6a4f] text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {passwordSubmitting ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
        
      </div>
    </div>
  );
}
